from typing import Dict, Any
from app.state import MedicalState

def report_agent_node(state: MedicalState) -> Dict[str, Any]:
    print("\n📋 [Report Agent] Compilation du rapport final structuré...")
    
    patient_name = state.get("patient_name", "Inconnu")
    patient_age = state.get("patient_age", "N/A")
    patient_gender = state.get("patient_gender", "N/A")
    chief_complaint = state.get("chief_complaint", "Non spécifié")
    summary = state.get("diagnostic_summary", "Non spécifié")
    care = state.get("interim_care", "Non spécifié")
    physician_treatment = state.get("physician_review", "Aucun (En attente d'avis médical)")
    
    # Construct structured final report
    report = (
        f"============================================================\n"
        f"          RAPPORT CLINIQUE D'ORIENTATION PRÉLIMINAIRE\n"
        f"============================================================\n"
        f"INFORMATIONS PATIENT\n"
        f"---------------------\n"
        f"Nom : {patient_name}\n"
        f"Âge : {patient_age} ans | Genre : {patient_gender}\n"
        f"Motif initial : {chief_complaint}\n\n"
        f"RÉSULTATS DE L'ORIENTATION\n"
        f"---------------------------\n"
        f"Synthèse clinique :\n{summary}\n\n"
        f"Recommandations temporaires :\n{care}\n\n"
        f"Avis & Traitement du médecin :\n{physician_treatment}\n\n"
        f"------------------------------------------------------------\n"
        f"⚠️ AVERTISSEMENT : Ce système ne remplace pas une consultation médicale.\n"
        f"============================================================"
    )
    
    print("📋 [Report Agent] Rapport final structuré généré avec succès.")
    return {
        "final_report": report,
        "status": "completed"
    }
