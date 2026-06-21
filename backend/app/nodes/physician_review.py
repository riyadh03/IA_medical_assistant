from typing import Dict, Any
from langgraph.types import interrupt
from app.state import MedicalState

def physician_review_node(state: MedicalState) -> Dict[str, Any]:
    print("\n🩺 [Physician Review Node] Préparation du cas pour la validation médicale...")
    
    summary = state.get("diagnostic_summary", "Pas de synthèse disponible.")
    care = state.get("interim_care", "Pas de recommandations temporaires.")
    
    # Call interrupt to pause graph execution, tagging the payload with type: physician_review
    print("⚠️ [Physician Review Node] Graph suspendu. En attente de la saisie des instructions par le médecin...")
    physician_input = interrupt({
        "type": "physician_review",
        "diagnostic_summary": summary,
        "interim_care": care
    })
    
    print(f"🩺 [Physician Review Node] Reprise du graphe détectée. Avis du médecin reçu : {physician_input}")
    return {
        "physician_review": physician_input,
        "status": "reviewed"
    }
