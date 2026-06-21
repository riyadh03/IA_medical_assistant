import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

class LLMClient:
    def __init__(self):
        self.providers = []
        self._init_providers()

    def _init_providers(self):
        openai_key = os.getenv("OPENAI_API_KEY")
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        gemini_key = os.getenv("GEMINI_API_KEY")
        model = os.getenv("LLM_MODEL")

        # Configure OpenAI provider
        if openai_key and "your_openai_api_key" not in openai_key:
            target_model = model if model and ("gpt" in model or "o1" in model) else "gpt-4o-mini"
            base_url = os.getenv("OPENAI_API_BASE", None)
            self.providers.append({
                "name": "OpenAI",
                "client": ChatOpenAI(model=target_model, api_key=openai_key, base_url=base_url)
            })

        # Configure OpenRouter provider
        if openrouter_key and "your_openrouter_api_key" not in openrouter_key:
            target_model = model if model and ("llama" in model or "mistral" in model or "claude" in model) else "meta-llama/llama-3.1-8b-instruct:free"
            self.providers.append({
                "name": "OpenRouter",
                "client": ChatOpenAI(model=target_model, api_key=openrouter_key, base_url="https://openrouter.ai/api/v1")
            })

        # Configure Gemini provider (OpenAI compatible endpoint)
        if gemini_key and "your_gemini_api_key" not in gemini_key:
            target_model = model if model and "gemini" in model else "gemini-1.5-flash"
            self.providers.append({
                "name": "Gemini",
                "client": ChatOpenAI(model=target_model, api_key=gemini_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/")
            })

        if not self.providers:
            print("⚠️ [LLM] Aucun fournisseur d'API configuré dans le .env. Mode simulation locale activé.")

    def _invoke_llm(self, messages) -> str:
        if not self.providers:
            raise RuntimeError("Aucun fournisseur LLM disponible.")
            
        last_error = None
        for provider in self.providers:
            try:
                print(f"🤖 [LLM] Tentative de génération via {provider['name']}...")
                response = provider["client"].invoke(messages)
                return response.content.strip()
            except Exception as e:
                print(f"⚠️ [LLM] Échec via {provider['name']} : {e}")
                last_error = e
                
        raise RuntimeError(f"Tous les fournisseurs LLM ont échoué. Dernière erreur : {last_error}")

    def generate_next_question(self, chief_complaint: str, patient_info: dict, question_answers: list, question_count: int) -> str:
        fallback_questions = [
            "Depuis quand ressentez-vous ces symptômes ?",
            "Avez-vous de la fièvre ? (Si oui, quelle est votre température ?)",
            "Avez-vous de la toux ou des maux de gorge ?",
            "Ressentez-vous des difficultés à respirer (essoufflement) ?",
            "Prenez-vous un traitement ou des médicaments actuellement ?"
        ]

        if not self.providers:
            if question_count < len(fallback_questions):
                return fallback_questions[question_count]
            return "Avez-vous d'autres précisions à apporter ?"

        history_lines = []
        for qa in question_answers:
            history_lines.append(f"- Assistant: {qa['question']}")
            history_lines.append(f"- Patient: {qa['answer']}")
        history_str = "\n".join(history_lines) if history_lines else "Aucun échange pour le moment."

        system_prompt = (
            "Vous êtes un assistant médical d'orientation clinique préliminaire académique.\n"
            "Votre rôle actuel est de poser l'unique question suivante (sur un total de 5 questions) afin d'approfondir le motif de consultation du patient.\n"
            "RÈGLES IMPORTANTES :\n"
            "- Générez une UNIQUE question courte, directe et rédigée en français.\n"
            "- La question doit s'adresser directement au patient (vouvoiement professionnel).\n"
            "- Adaptez la question de manière pertinente en fonction de l'âge, du genre, du motif initial du patient et des réponses déjà fournies.\n"
            "- Ne posez pas de question sur un point déjà clarifié par les réponses précédentes ou le motif initial.\n"
            "- Restez focalisé sur les critères cliniques clés pertinents pour le cas : apparition/durée, localisation/intensité, symptômes d'accompagnement clés, facteurs de risque éventuels, traitements en cours, ou antécédents médicaux.\n"
            "- Soyez concis : ne formulez pas d'explication ou de salutation avant ou après la question. Écrivez juste la question."
        )

        user_prompt = (
            f"Profil du patient : Nom: {patient_info.get('name')}, Âge: {patient_info.get('age')}, Genre: {patient_info.get('gender')}\n"
            f"Motif initial : {chief_complaint}\n\n"
            f"Historique des questions et réponses précédentes :\n{history_str}\n\n"
            f"Question actuelle à poser : numéro {question_count + 1} sur 5.\n"
            f"Formulez l'unique question suivante :"
        )

        try:
            question = self._invoke_llm([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            question = question.strip().strip('"').strip("'")
            if not question.endswith("?") and not question.endswith("}"):
                question += " ?"
            return question
        except Exception as e:
            print(f"❌ [LLM Error] Bascule sur la question statique numéro {question_count + 1} : {e}")
            if question_count < len(fallback_questions):
                return fallback_questions[question_count]
            return "Avez-vous d'autres précisions à apporter ?"

    def generate_synthesis(self, chief_complaint: str, question_answers: list, search_context: str = None, red_flags: dict = None) -> str:
        qa_str = "\n".join([f"- Q: {qa['question']}\n  R: {qa['answer']}" for qa in question_answers])
        
        system_prompt = (
            "Vous êtes un assistant médical d'orientation clinique préliminaire académique.\n"
            "Analysez la plainte principale du patient et ses réponses aux questions de suivi.\n"
            "Générez une synthèse clinique préliminaire structurée et prudente.\n"
            "RÈGLES IMPORTANTES :\n"
            "- Ne donnez JAMAIS de diagnostic définitif ni de traitement précis (médicaments).\n"
            "- Utilisez uniquement des termes recommandés comme 'orientation clinique préliminaire', 'synthèse clinique'.\n"
            "- Intégrez les résultats de la recherche médicale externe dynamique (contexte) fournie pour justifier vos orientations cliniques (citez les sources/sites de référence si disponibles).\n"
            "- Prenez en compte l'évaluation locale des red flags (drapeaux rouges) fournie pour évaluer la gravité et la nécessité d'une consultation urgente.\n"
            "- Rappelez que ce système est académique et ne remplace pas un avis médical."
        )
        
        user_prompt = (
            f"Plainte principale : {chief_complaint}\n\n"
            f"Réponses aux questions de suivi :\n{qa_str}\n\n"
        )
        
        if search_context:
            user_prompt += f"Résultats de la recherche médicale externe (Tavily Search) :\n{search_context}\n\n"
            
        if red_flags:
            user_prompt += f"Évaluation de sécurité (Red Flags locaux) :\n- Niveau de risque : {red_flags.get('risk_level', 'LOW')}\n- Recommandation urgente : {red_flags.get('urgent_medical_consultation_recommended', False)}\n- Message : {red_flags.get('message', '')}\n\n"

        try:
            return self._invoke_llm([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
        except Exception as e:
            print(f"❌ [LLM Error] Bascule sur la simulation locale de synthèse : {e}")
            return self._fallback_synthesis(chief_complaint, question_answers, search_context, red_flags)

    def generate_interim_care(self, synthesis: str, search_context: str = None, red_flags: dict = None) -> str:
        system_prompt = (
            "Vous êtes un assistant médical d'orientation clinique préliminaire académique.\n"
            "En vous basant sur la synthèse clinique préliminaire fournie, proposez des recommandations intermédiaires générales et prudentes.\n"
            "RÈGLES IMPORTANTES :\n"
            "- Ne recommandez aucun médicament sur ordonnance.\n"
            "- Proposez uniquement des soins généraux comme : repos, hydratation, surveillance, et consultation médicale si les symptômes persistent ou s'aggravent.\n"
            "- Si l'évaluation de sécurité ou les guidelines suggèrent un risque élevé (URGENT), recommandez clairement d'appeler les urgences (15/SAMU ou 112) ou de consulter immédiatement.\n"
            "- Ne donnez pas de diagnostic définitif."
        )
        
        user_prompt = f"Synthèse clinique préliminaire :\n{synthesis}\n\n"
        if search_context:
            user_prompt += f"Guidelines et recommandations récupérées de la recherche :\n{search_context}\n\n"
        if red_flags:
            user_prompt += f"Alerte de gravité (Red Flags locaux) :\n- Niveau de risque : {red_flags.get('risk_level', 'LOW')}\n- Message : {red_flags.get('message', '')}\n\n"

        try:
            return self._invoke_llm([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
        except Exception as e:
            print(f"❌ [LLM Error] Bascule sur la simulation locale de recommandations : {e}")
            return self._fallback_interim_care(synthesis, search_context, red_flags)

    def _fallback_synthesis(self, chief_complaint: str, question_answers: list, search_context: str = None, red_flags: dict = None) -> str:
        symptoms = []
        for qa in question_answers:
            q = qa['question'].lower()
            a = qa['answer']
            if "depuis" in q:
                symptoms.append(f"Durée : {a}")
            elif "fièvre" in q:
                symptoms.append(f"Fièvre : {a}")
            elif "toux" in q:
                symptoms.append(f"Toux : {a}")
            elif "respirer" in q or "essoufflement" in q:
                symptoms.append(f"Respiration : {a}")
            elif "traitement" in q:
                symptoms.append(f"Médicaments actuels : {a}")
                
        symptoms_str = "\n".join(symptoms)
        
        risk_str = "LOW"
        if red_flags:
            risk_str = red_flags.get('risk_level', 'LOW')
            
        search_summary = ""
        if search_context:
            search_summary = f"\n\nContexte de recherche médicale externe :\n{search_context}"
            
        return (
            f"--- Synthèse clinique préliminaire (Mode Simulation) ---\n"
            f"Plainte initiale : '{chief_complaint}'.\n"
            f"Détails cliniques collectés :\n{symptoms_str}\n"
            f"Niveau d'alerte de gravité (Red Flags) : {risk_str}"
            f"{search_summary}\n\n"
            f"Analyse préliminaire : Les symptômes rapportés indiquent une orientation vers une affection respiratoire ou systémique de niveau de risque {risk_str}. "
            f"Pas de diagnostic posé. Sous réserve d'évaluation médicale formelle."
        )

    def _fallback_interim_care(self, synthesis: str, mcp_guidelines: str = None, red_flags: dict = None) -> str:
        base_care = (
            "--- Recommandation intermédiaire (Mode Simulation) ---\n"
            "- Repos complet au calme.\n"
            "- Hydratation abondante régulière (eau, infusions).\n"
            "- Surveillance attentive de la température et de la respiration.\n"
            "- Consultation médicale sans tarder en cas de gêne respiratoire ou de détérioration de l'état général."
        )
        if red_flags and red_flags.get('urgent_medical_consultation_recommended', False):
            base_care += f"\n\n🚨 ALERTE DE GRAVITÉ CLINIQUE :\n{red_flags.get('message', '')}"
            
        if mcp_guidelines:
            base_care += f"\n\nGuidelines de référence (MCP Search) :\n{mcp_guidelines}"
        return base_care

# Instantiate LLM Client singleton
llm_client = LLMClient()
