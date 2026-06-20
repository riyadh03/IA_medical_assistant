import os
import sys

# Ensure the backend directory is in the python path for app imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.graph import compiled_graph

def run_sprint1_demo():
    print("🚀 Démarage du Workflow Médical (Sprint 1 — Cœur LangGraph)\n")
    
    # 1. Define initial state for simulation
    initial_state = {
        "workflow_id": "sprint-1-test-id",
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
    
    # 2. Invoke the compiled LangGraph workflow
    final_state = compiled_graph.invoke(initial_state)
    
    print("\n--- Sortie du Workflow ---")
    if "final_report" in final_state:
        print(final_state["final_report"])
    else:
        print("❌ Erreur : Le rapport final n'a pas été généré.")
    print("--------------------------")

if __name__ == "__main__":
    run_sprint1_demo()
