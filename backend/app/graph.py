import os
import sys

# Ensure correct import resolution when run as a script inside Docker or locally
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from langgraph.graph import StateGraph, START, END
from app.state import MedicalState
from app.nodes.supervisor import supervisor_node
from app.nodes.diagnostic_agent import diagnostic_agent_node
from app.nodes.report_agent import report_agent_node

# Initialize graph builder with the shared MedicalState
workflow = StateGraph(MedicalState)

# Add our nodes to the workflow graph
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("diagnostic_agent", diagnostic_agent_node)
workflow.add_node("report_agent", report_agent_node)

# Entry point starts at the Supervisor
workflow.add_edge(START, "supervisor")

# Define conditional routing logic from Supervisor decisions
def route_from_supervisor(state: MedicalState) -> str:
    next_step = state.get("next")
    if next_step == "FINISH":
        return END
    return next_step

workflow.add_conditional_edges(
    "supervisor",
    route_from_supervisor,
    {
        "diagnostic_agent": "diagnostic_agent",
        "report_agent": "report_agent",
        END: END
    }
)

# Connect worker nodes back to the Supervisor to determine the next action
workflow.add_edge("diagnostic_agent", "supervisor")
workflow.add_edge("report_agent", "supervisor")

# Compile the final workflow graph
compiled_graph = workflow.compile()

if __name__ == "__main__":
    print("🚀 Démarage du Workflow Médical (Sprint 1 — Docker Execution)\n")
    
    initial_state = {
        "workflow_id": "sprint-1-docker-test",
        "patient_name": "Jean Dupont",
        "patient_age": 45,
        "patient_gender": "Masculin",
        "chief_complaint": "Fièvre modérée et toux sèche depuis 3 jours.",
        "question_count": 0,
        "question_answers": [],
        "status": "started"
    }
    
    print("--- Entrée Patient ---")
    print(f"Patient : {initial_state['patient_name']} ({initial_state['patient_age']} ans, {initial_state['patient_gender']})")
    print(f"Plainte principale : {initial_state['chief_complaint']}")
    print("----------------------\n")
    
    final_state = compiled_graph.invoke(initial_state)
    
    print("\n--- Sortie du Workflow ---")
    if "final_report" in final_state:
        print(final_state["final_report"])
    else:
        print("❌ Erreur : Le rapport final n'a pas été généré.")
    print("--------------------------")

