import asyncio
import os
import sys
import json
from typing import Dict, Any
from langgraph.types import interrupt
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from app.state import MedicalState
from app.llm_client import llm_client

# Mandatory questions to gather clinical context
QUESTIONS = [
    "Depuis quand ressentez-vous ces symptômes ?",
    "Avez-vous de la fièvre ? (Si oui, quelle est votre température ?)",
    "Avez-vous de la toux ou des maux de gorge ?",
    "Ressentez-vous des difficultés à respirer (essoufflement) ?",
    "Prenez-vous un traitement ou des médicaments actuellement ?"
]

async def query_mcp_tools(chief_complaint: str, fever: bool, breathing: bool, chest: bool) -> tuple:
    """Queries the MCP server for web medical search and local red flags."""
    server_path = "/mcp_server/server.py"
    if not os.path.exists(server_path):
        # Fallback to local path relative to this file
        base_dir = os.path.dirname(os.path.abspath(__file__))
        server_path = os.path.abspath(os.path.join(base_dir, "..", "..", "..", "mcp_server", "server.py"))
        
    if not os.path.exists(server_path):
        print(f"⚠️ [MCP Client] Serveur introuvable à {server_path}, skipping MCP calls.", file=sys.stderr)
        return None, None

    print(f"🔌 [MCP Client] Connexion au serveur MCP à {server_path}...", file=sys.stderr)
    server_params = StdioServerParameters(
        command="python",
        args=[server_path],
        env=os.environ.copy()
    )
    
    search_results = None
    red_flags_data = None
    
    try:
        async with stdio_client(server_params) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                print("🔌 [MCP Client] Session initialisée.", file=sys.stderr)
                
                # 1. Call red_flag_checker
                print(f"🔌 [MCP Client] Appel 'red_flag_checker' (fever={fever}, breathing={breathing}, chest={chest})", file=sys.stderr)
                flag_res = await session.call_tool("red_flag_checker", {
                    "fever": fever,
                    "breathing_difficulty": breathing,
                    "chest_pain": chest
                })
                if flag_res.content and len(flag_res.content) > 0:
                    red_flags_data = json.loads(flag_res.content[0].text)
                    print(f"🔌 [MCP Client] Réponse red_flags : {red_flags_data.get('risk_level')}", file=sys.stderr)
                
                # 2. Call web_medical_search
                search_query = f"clinical guidelines orientation warning signs {chief_complaint}"
                print(f"🔌 [MCP Client] Appel 'web_medical_search' pour: '{search_query}'", file=sys.stderr)
                search_res = await session.call_tool("web_medical_search", {
                    "query": search_query
                })
                if search_res.content and len(search_res.content) > 0:
                    search_results = search_res.content[0].text
                    print(f"🔌 [MCP Client] Réponse search obtenue.", file=sys.stderr)
                    
        return search_results, red_flags_data
    except Exception as e:
        print(f"⚠️ [MCP Client] Échec de la communication avec le serveur MCP: {e}", file=sys.stderr)
        return None, None

def diagnostic_agent_node(state: MedicalState) -> Dict[str, Any]:
    q_count = state.get("question_count", 0)
    q_answers = state.get("question_answers", [])
    if q_answers is None:
        q_answers = []
    
    # 1. Dialogue Loop: Use interrupt to collect the answer via API/Runner
    if q_count < 5:
        chief_complaint = state.get("chief_complaint", "Non spécifié")
        patient_info = {
            "name": state.get("patient_name", "Non spécifié"),
            "age": state.get("patient_age", "Non spécifié"),
            "gender": state.get("patient_gender", "Non spécifié")
        }
        
        # Generate question dynamically via LLM client
        question_text = llm_client.generate_next_question(
            chief_complaint=chief_complaint,
            patient_info=patient_info,
            question_answers=q_answers,
            question_count=q_count
        )
        
        print(f"\n🩺 [Diagnostic Agent] Interruption pour recueillir la réponse à la question {q_count + 1}/5...")
        
        # Interrupt graph execution and return the question details
        answer = interrupt({
            "type": "patient_question",
            "question": question_text,
            "index": q_count
        })
        
        print(f"🩺 [Diagnostic Agent] Reprise. Réponse collectée pour la question {q_count + 1} : {answer}")
        
        # Store Q/A
        new_qa = {"question": question_text, "answer": answer}
        updated_answers = list(q_answers)
        updated_answers.append(new_qa)
        
        return {
            "question_count": q_count + 1,
            "question_answers": updated_answers,
            "status": "waiting_patient"
        }
    
    # 2. Loop Complete: Perform Clinical Synthesis & Recommending Interim Care
    print("\n🩺 [Diagnostic Agent] Analyse clinique préliminaire en cours via LLM...")
    
    chief_complaint = state.get("chief_complaint", "Non spécifié")
    
    # 2.1 Dynamically analyze symptoms from chief complaint and answers
    comp_lower = chief_complaint.lower()
    fever_flag = any(kw in comp_lower for kw in ["fièvre", "fievre", "température", "temperature", "fever", "chaud"])
    breathing_flag = any(kw in comp_lower for kw in ["essoufflement", "respirer", "difficulté à respirer", "dyspnée", "gêne respiratoire", "respiration", "breathing"])
    chest_flag = any(kw in comp_lower for kw in ["poitrine", "chest", "coeur", "cœur", "douleur thoracique", "cardiaque"])
    
    for qa in q_answers:
        ans = qa.get("answer", "").lower()
        if any(kw in ans for kw in ["fièvre", "fievre", "température", "temperature", "fever", "chaud"]):
            if not any(neg in ans for neg in ["pas de", "aucune", "no ", "sans "]):
                fever_flag = True
        if any(kw in ans for kw in ["essoufflement", "respirer", "difficulté à respirer", "dyspnée", "gêne respiratoire", "respiration", "breathing"]):
            if not any(neg in ans for neg in ["pas de", "aucune", "no ", "sans "]):
                breathing_flag = True
        if any(kw in ans for kw in ["poitrine", "chest", "coeur", "cœur", "douleur thoracique", "cardiaque"]):
            if not any(neg in ans for neg in ["pas de", "aucune", "no ", "sans "]):
                chest_flag = True
                
    # 2.2 Query MCP Server tools (web search + red flags checker)
    search_context = None
    red_flags = None
    try:
        search_context, red_flags = asyncio.run(query_mcp_tools(
            chief_complaint, fever_flag, breathing_flag, chest_flag
        ))
    except Exception as e:
        print(f"⚠️ [Diagnostic Agent] Échec lors de la requête MCP: {e}", file=sys.stderr)
    
    # 2.3 Generate clinical synthesis incorporating search results and red flags
    synthesis = llm_client.generate_synthesis(chief_complaint, q_answers, search_context, red_flags)
    
    # 2.4 Generate interim care recommendations incorporating search results and red flags
    care = llm_client.generate_interim_care(synthesis, search_context, red_flags)
    
    print("🩺 [Diagnostic Agent] Synthèse clinique et recommandations d'urgence complétées.")
    return {
        "diagnostic_summary": synthesis,
        "interim_care": care,
        "status": "waiting_physician"
    }
