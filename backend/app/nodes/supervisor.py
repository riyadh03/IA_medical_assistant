from typing import Dict, Any
from app.state import MedicalState

def supervisor_node(state: MedicalState) -> Dict[str, Any]:
    print("\n🧠 [Supervisor] Évaluation de l'état du workflow...")
    
    q_count = state.get("question_count", 0)
    summary = state.get("diagnostic_summary")
    physician_rev = state.get("physician_review")
    report = state.get("final_report")
    
    print(
        f"🧠 [Supervisor] État : {q_count}/5 questions posées | "
        f"Synthèse : {'Générée' if summary else 'En attente'} | "
        f"Avis médecin : {'Reçu' if physician_rev else 'En attente'} | "
        f"Rapport : {'Généré' if report else 'En attente'}"
    )
    
    # 1. Collect answers until we reach 5 questions
    if q_count < 5:
        next_step = "diagnostic_agent"
    # 2. Compile synthesis if not yet compiled
    elif not summary:
        next_step = "diagnostic_agent"
    # 3. Route to physician review if not reviewed yet (Human-in-the-Loop)
    elif not physician_rev:
        next_step = "physician_review"
    # 4. Route to report agent once review is completed
    elif not report:
        next_step = "report_agent"
    # 5. Finish workflow
    else:
        next_step = "FINISH"
        
    print(f"🧠 [Supervisor] Prochaine étape décidée : {next_step}")
    return {"next": next_step}
