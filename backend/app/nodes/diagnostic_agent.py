from typing import Dict, Any
from app.state import MedicalState

def diagnostic_agent_node(state: MedicalState) -> Dict[str, Any]:
    print(f"\n🩺 [Diagnostic Agent] Début de l'analyse clinique pour {state.get('patient_name', 'Inconnu')}...")
    
    patient_name = state.get("patient_name", "Inconnu")
    patient_age = state.get("patient_age", "N/A")
    patient_gender = state.get("patient_gender", "N/A")
    chief_complaint = state.get("chief_complaint", "Non spécifié")
    
    # Simulate a preliminary clinical synthesis based on complaint details
    summary = (
        f"Orientation clinique préliminaire pour {patient_name} ({patient_age} ans, {patient_gender}).\n"
        f"Plainte principale : '{chief_complaint}'.\n"
        f"Observation : Suspicion d'affection bénigne nécessitant repos et suivi."
    )
    
    # Simulate basic interim care
    care = "Reposez-vous, buvez beaucoup d'eau, et surveillez l'évolution de la température."
    
    print("🩺 [Diagnostic Agent] Synthèse clinique préliminaire et recommandations générées.")
    return {
        "diagnostic_summary": summary,
        "interim_care": care,
        "status": "waiting_physician"
    }
