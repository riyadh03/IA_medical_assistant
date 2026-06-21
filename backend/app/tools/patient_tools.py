import sys

def ask_patient_tool(question_text: str, question_count: int) -> str:
    """
    Outil d'interaction avec le patient.
    Pose une question au patient et récupère sa réponse.
    Si le terminal n'est pas interactif (docker-compose standard), renvoie une réponse simulée.
    """
    print(f"\n💬 [Outil: ask_patient] Question {question_count}/5 : {question_text}")
    
    # Check if standard input is an interactive terminal (TTY)
    if sys.stdin.isatty():
        try:
            answer = input("Patient > ")
            if answer.strip():
                return answer.strip()
        except (KeyboardInterrupt, EOFError):
            print("\n⚠️ Interruption du clavier. Utilisation d'une réponse simulée...")

    # Simulated default answers to prevent hanging in non-interactive environments
    simulated_responses = {
        1: "Depuis environ 3 jours, ça a commencé après un coup de froid.",
        2: "Oui, j'ai une fièvre modérée, autour de 38.2°C ce matin.",
        3: "Oui, j'ai une toux sèche irritante, surtout la nuit.",
        4: "Non, pas de difficulté à respirer ni d'essoufflement pour le moment.",
        5: "Je prends uniquement du paracétamol en cas de mal de tête."
    }
    
    simulated_answer = simulated_responses.get(question_count, "Rien à signaler.")
    print(f"Patient (Simulé) > {simulated_answer}")
    return simulated_answer
