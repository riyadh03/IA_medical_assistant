from typing import Dict, Any
from app.state import MedicalState

def supervisor_node(state: MedicalState) -> Dict[str, Any]:
    print("\n🧠 [Supervisor] Évaluation de l'état du workflow...")
    
    # Check if patient case is admitted but has no diagnostic summary yet
    if not state.get("diagnostic_summary"):
        next_step = "diagnostic_agent"
    elif not state.get("final_report"):
        next_step = "report_agent"
    else:
        next_step = "FINISH"
        
    print(f"🧠 [Supervisor] Prochaine étape décidée : {next_step}")
    return {"next": next_step}
