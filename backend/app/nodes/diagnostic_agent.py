import asyncio
import os
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

async def get_guidelines_from_mcp(symptom: str) -> str:
    """Queries the MCP server for clinical guidelines regarding the symptom."""
    server_path = "/mcp_server/server.py"
    if not os.path.exists(server_path):
        # Fallback to local path relative to this file
        base_dir = os.path.dirname(os.path.abspath(__file__))
        server_path = os.path.abspath(os.path.join(base_dir, "..", "..", "..", "mcp_server", "server.py"))
        
    if not os.path.exists(server_path):
        print(f"⚠️ [MCP Client] Serveur introuvable à {server_path}, skipping MCP call.")
        return None

    print(f"🔌 [MCP Client] Connexion au serveur MCP à {server_path}...")
    server_params = StdioServerParameters(
        command="python",
        args=[server_path],
        env=os.environ.copy()
    )
    
    try:
        async with stdio_client(server_params) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                print(f"🔌 [MCP Client] Session initialisée. Appel de 'medical_guidelines' pour: '{symptom}'")
                response = await session.call_tool("medical_guidelines", {"symptom": symptom})
                if response.content and len(response.content) > 0:
                    guidelines = response.content[0].text
                    print(f"🔌 [MCP Client] Guidelines reçues : {guidelines}")
                    return guidelines
                return None
    except Exception as e:
        print(f"⚠️ [MCP Client] Échec de la communication avec le serveur MCP: {e}")
        return None

def diagnostic_agent_node(state: MedicalState) -> Dict[str, Any]:
    q_count = state.get("question_count", 0)
    q_answers = state.get("question_answers", [])
    if q_answers is None:
        q_answers = []
    
    # 1. Dialogue Loop: Use interrupt to collect the answer via API/Runner
    if q_count < 5:
        question_text = QUESTIONS[q_count]
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
    
    # Query MCP server for guidelines
    mcp_guidelines = None
    try:
        mcp_guidelines = asyncio.run(get_guidelines_from_mcp(chief_complaint))
    except Exception as e:
        print(f"⚠️ [Diagnostic Agent] Échec lors de l'exécution de la requête MCP: {e}")
    
    # Generate clinical synthesis
    synthesis = llm_client.generate_synthesis(chief_complaint, q_answers)
    
    # Generate interim care recommendations (integrating MCP guidelines)
    care = llm_client.generate_interim_care(synthesis, mcp_guidelines)
    
    print("🩺 [Diagnostic Agent] Synthèse clinique et recommandations d'urgence complétées.")
    return {
        "diagnostic_summary": synthesis,
        "interim_care": care,
        "status": "waiting_physician"
    }
