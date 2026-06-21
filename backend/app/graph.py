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
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command

from app.state import MedicalState
from app.nodes.supervisor import supervisor_node
from app.nodes.diagnostic_agent import diagnostic_agent_node
from app.nodes.physician_review import physician_review_node
from app.nodes.report_agent import report_agent_node

# Initialize graph builder with the shared MedicalState
workflow = StateGraph(MedicalState)

# Add our nodes to the workflow graph
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("diagnostic_agent", diagnostic_agent_node)
workflow.add_node("physician_review", physician_review_node)
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
        "physician_review": "physician_review",
        "report_agent": "report_agent",
        END: END
    }
)

# Connect worker nodes back to the Supervisor to determine the next action
workflow.add_edge("diagnostic_agent", "supervisor")
workflow.add_edge("physician_review", "supervisor")
workflow.add_edge("report_agent", "supervisor")

# Compile the final workflow graph with MemorySaver for checkpointing and HITL support
checkpointer = MemorySaver()
compiled_graph = workflow.compile(checkpointer=checkpointer)

if __name__ == "__main__":
    print("🚀 Démarage du Workflow Médical (Sprint 4 — Persistent Execution)\n")
    
    initial_state = {
        "workflow_id": "sprint-4-docker-test",
        "patient_name": "Jean Dupont",
        "patient_age": 45,
        "patient_gender": "Masculin",
        "chief_complaint": "Fièvre modérée et toux sèche depuis 3 jours.",
        "question_count": 0,
        "question_answers": [],
        "status": "started"
    }
    
    config = {"configurable": {"thread_id": "sprint-4-test-thread"}}
    
    print("--- Entrée Patient ---")
    print(f"Patient : {initial_state['patient_name']} ({initial_state['patient_age']} ans, {initial_state['patient_gender']})")
    print(f"Plainte principale : {initial_state['chief_complaint']}")
    print("----------------------\n")
    
    # 1. Run the graph initially (will pause at the first question interrupt)
    state = compiled_graph.invoke(initial_state, config)
    
    # Simulated answers for automated test runs
    simulated_answers = [
        "Depuis environ 3 jours, ça a commencé après un coup de froid.",
        "Oui, j'ai une fièvre modérée, autour de 38.2°C ce matin.",
        "Oui, j'ai une toux sèche irritante, surtout la nuit.",
        "Non, pas de difficulté à respirer ni d'essoufflement pour le moment.",
        "Je prends uniquement du paracétamol en cas de mal de tête."
    ]
    
    # 2. Main loop: process interrupts reactively until complete
    while True:
        state_snapshot = compiled_graph.get_state(config)
        # If there's no next node, the graph finished
        if not state_snapshot.next:
            break
            
        tasks = state_snapshot.tasks
        if not tasks or not tasks[0].interrupts:
            break
            
        interrupt_value = tasks[0].interrupts[0].value
        
        # Check interrupt type
        if isinstance(interrupt_value, dict) and interrupt_value.get("type") == "patient_question":
            q_text = interrupt_value["question"]
            q_idx = interrupt_value["index"]
            
            # Prompt patient interactively or fall back to simulation
            if sys.stdin.isatty():
                try:
                    ans = input(f"\n💬 [Outil: ask_patient] Question {q_idx+1}/5 : {q_text}\nPatient > ")
                except (KeyboardInterrupt, EOFError):
                    ans = simulated_answers[q_idx]
            else:
                ans = simulated_answers[q_idx]
                print(f"\n💬 [Outil: ask_patient] Question {q_idx+1}/5 : {q_text}")
                print(f"Patient (Simulé) > {ans}")
                
            # Resume with patient answer
            state = compiled_graph.invoke(Command(resume=ans), config)
            
        elif isinstance(interrupt_value, dict) and interrupt_value.get("type") == "physician_review":
            summary = interrupt_value["diagnostic_summary"]
            care = interrupt_value["interim_care"]
            
            print("\n📥 [HITL Interrupt] Exécution suspendue.")
            print(f"📋 Synthèse clinique générée :\n{summary}")
            print(f"💡 Recommandation temporaire :\n{care}")
            
            # Prompt physician interactively or fall back to simulation
            if sys.stdin.isatty():
                try:
                    physician_treatment = input("\nMédecin (Saisir le traitement) > ")
                except (KeyboardInterrupt, EOFError):
                    physician_treatment = "Repos et surveillance."
            else:
                physician_treatment = "Repos à la maison, hydratation, paracétamol 1g en cas de fièvre (>38.5°C) toutes les 6h, surveillance des symptômes."
                print(f"\nMédecin (Simulé) > {physician_treatment}")
                
            # Resume with physician treatment
            state = compiled_graph.invoke(Command(resume=physician_treatment), config)
            
    print("\n--- Sortie du Workflow ---")
    if "final_report" in state:
        print(state["final_report"])
    else:
        print("❌ Erreur : Le rapport final n'a pas été généré.")
    print("--------------------------")
