import sys
import os
import requests
import json
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("medical-search-server")

def get_simulated_search(query: str) -> str:
    """Helper to return high-quality mock medical guidelines and references if Tavily is unavailable."""
    q = query.lower()
    
    if any(keyword in q for keyword in ["fever", "fièvre", "fievre", "température", "temperature"]):
        summary = (
            "According to clinical standards (WHO / Mayo Clinic), adult fever (>38°C) is a physiological response to infection. "
            "Interim guidelines emphasize adequate hydration (2-3L/day), physical cooling measures, and close monitoring. "
            "Red flags indicating immediate medical attention include fever lasting > 72 hours, stiff neck, severe headache, confusion, or breathing difficulties."
        )
        sources = [
            "- **Mayo Clinic - Fever Guidelines**: https://www.mayoclinic.org/diseases-conditions/fever/symptoms-causes/syc-20352759",
            "- **WHO - Infectious Diseases Management**: https://www.who.int/publications/i/item/9789241549691"
        ]
    elif any(keyword in q for keyword in ["cough", "toux", "gorge"]):
        summary = (
            "Clinical guidelines for acute cough state that benign post-viral coughs can persist for 3-4 weeks. "
            "Recommended supportive actions are vocal rest, warm demulcent fluids (e.g., honey for adults), and avoiding airway irritants. "
            "Warning signs (red flags) include hemoptysis (coughing blood), severe shortness of breath, chest pain, or wheezing."
        )
        sources = [
            "- **NHS - Cough and Respiratory Infections**: https://www.nhs.uk/conditions/cough/",
            "- **American Lung Association - Learning About Cough**: https://www.lung.org/lung-health-diseases/lung-disease-lookup/cough"
        ]
    elif any(keyword in q for keyword in ["respirer", "essoufflement", "breathing", "respiration", "dyspn"]):
        summary = (
            "Dyspnea (shortness of breath) is a high-priority warning sign. Clinical protocols require immediate evaluation. "
            "Interim advice focuses on resting in an upright position, avoiding exertion, and self-monitoring oxygenation if pulse oximetry is available. "
            "Severe indicators (cyanosis, chest tightness, respiratory rate > 25/min) warrant emergency medical services (SAMU/15)."
        )
        sources = [
            "- **CDC - Respiratory Emergencies**: https://www.cdc.gov/disasters/extremeheat/emergencies.html",
            "- **British Lung Foundation - Breathlessness Guidelines**: https://www.blf.org.uk/support-for-you/breathlessness"
        ]
    elif any(keyword in q for keyword in ["chest", "poitrine", "thoracique", "coeur", "cœur"]):
        summary = (
            "Acute chest pain must be treated as a medical emergency until cardiac or pulmonary vascular origin is ruled out. "
            "Interim guidelines require complete physical rest and immediate call to emergency services (SAMU/15). "
            "Do not drive yourself to the clinic. Watch for radiating pain to the arm, neck, or jaw, accompanied by diaphoresis."
        )
        sources = [
            "- **American Heart Association - Warning Signs of Cardiac Event**: https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack",
            "- **HAS France - Prise en charge de la douleur thoracique**: https://www.has-sante.fr/"
        ]
    else:
        summary = (
            "General clinical orientation guidelines state that initial symptom assessment should document duration, severity, and onset patterns. "
            "Supportive care measures include physical rest, balanced hydration, and monitoring for worsening symptoms."
        )
        sources = [
            "- **WHO - Clinical Practice Guidelines**: https://www.who.int",
            "- **Haute Autorité de Santé (HAS) - Fiches d'orientation**: https://www.has-sante.fr"
        ]
        
    sources_str = "\n".join(sources)
    return f"### [Simulated Clinical Search Summary]\n{summary}\n\n### [Top Clinical Sources]\n{sources_str}"

@mcp.tool()
def web_medical_search(query: str) -> str:
    """Perform a web search using Tavily API to fetch clinical orientation context, recent medical guidelines, and warnings.
    
    Args:
        query: The medical search query (e.g., 'cough fever guidelines warning signs').
    """
    tavily_key = os.getenv("TAVILY_API_KEY", "").strip()
    if not tavily_key or "your_tavily_api_key" in tavily_key:
        print("⚠️ [MCP Server] TAVILY_API_KEY non configurée. Bascule sur la recherche locale simulée.", file=sys.stderr)
        return get_simulated_search(query)

    print(f"🔌 [MCP Server] Envoi de la requête de recherche à Tavily: '{query}'", file=sys.stderr)
    url = "https://api.tavily.com/search"
    headers = {"Content-Type": "application/json"}
    payload = {
        "api_key": tavily_key,
        "query": query,
        "search_depth": "basic",
        "include_answer": True
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            data = response.json()
            answer = data.get("answer", "")
            results = data.get("results", [])
            
            # Format the sources cleanly
            sources = []
            for r in results[:3]:  # Top 3 sources
                sources.append(f"- **{r.get('title', 'Source')}**: {r.get('url', 'N/A')}\n  Snippet: {r.get('content', '')[:150]}...")
            
            sources_str = "\n".join(sources)
            output = f"### [Tavily Web Search Summary]\n{answer}\n\n### [Top Clinical Sources]\n{sources_str}"
            return output
        else:
            print(f"⚠️ [MCP Server] Échec Tavily (HTTP {response.status_code}): {response.text}", file=sys.stderr)
            return get_simulated_search(query)
    except Exception as e:
        print(f"⚠️ [MCP Server] Erreur lors de l'appel Tavily: {e}", file=sys.stderr)
        return get_simulated_search(query)

@mcp.tool()
def red_flag_checker(fever: bool, breathing_difficulty: bool, chest_pain: bool) -> str:
    """Evaluate if the patient's symptoms trigger clinical 'Red Flags' requiring urgent consultation.
    
    Args:
        fever: True if the patient reports a significant fever.
        breathing_difficulty: True if the patient reports shortness of breath or breathing difficulty.
        chest_pain: True if the patient reports chest pain or pressure.
    """
    urgent = False
    risk_level = "LOW"
    reasons = []
    
    if chest_pain:
        urgent = True
        risk_level = "URGENT"
        reasons.append("- Douleur thoracique suspecte (risque cardiaque/pulmonaire aigu)")
        
    if breathing_difficulty:
        urgent = True
        risk_level = "URGENT" if risk_level == "URGENT" else "MODERATE_TO_HIGH"
        reasons.append("- Difficulté respiratoire ou essoufflement (risque d'hypoxie/détresse respiratoire)")
        
    if fever:
        if risk_level == "LOW":
            risk_level = "MODERATE"
        reasons.append("- Présence de fièvre (nécessite surveillance thermique)")

    if urgent:
        reason_str = "\n".join(reasons)
        return json.dumps({
            "urgent_medical_consultation_recommended": True,
            "risk_level": risk_level,
            "reasons": reasons,
            "message": f"🚨 ALERTE DE GRAVITÉ CLINIQUE (Niveau : {risk_level})\nUne consultation médicale urgente est fortement recommandée en raison des signes d'alerte suivants :\n{reason_str}"
        }, ensure_ascii=False)
    else:
        return json.dumps({
            "urgent_medical_consultation_recommended": False,
            "risk_level": "LOW",
            "reasons": [],
            "message": "✅ Aucun drapeau rouge de gravité immédiate détecté. Suivre les recommandations d'orientation standards et surveiller l'évolution."
        }, ensure_ascii=False)

if __name__ == "__main__":
    mcp.run()
