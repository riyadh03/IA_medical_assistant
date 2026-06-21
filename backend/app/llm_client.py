import os
from dotenv import load_dotenv
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

    def generate_synthesis(self, chief_complaint: str, question_answers: list) -> str:
        qa_str = "\n".join([f"- Q: {qa['question']}\n  R: {qa['answer']}" for qa in question_answers])
        
        system_prompt = (
            "Vous êtes un assistant médical d'orientation clinique préliminaire académique.\n"
            "Analysez la plainte principale du patient et ses réponses aux questions de suivi.\n"
            "Générez une synthèse clinique préliminaire structurée et prudente.\n"
            "RÈGLES IMPORTANTES :\n"
            "- Ne donnez JAMAIS de diagnostic définitif ni de traitement précis (médicaments).\n"
            "- Utilisez uniquement des termes recommandés comme 'orientation clinique préliminaire', 'synthèse clinique'.\n"
            "- Rappelez que ce système est académique et ne remplace pas un avis médical."
        )
        
        user_prompt = (
            f"Plainte principale : {chief_complaint}\n\n"
            f"Réponses aux questions de suivi :\n{qa_str}"
        )

        try:
            return self._invoke_llm([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
        except Exception as e:
            print(f"❌ [LLM Error] Bascule sur la simulation locale : {e}")
            return self._fallback_synthesis(chief_complaint, question_answers)

    def generate_interim_care(self, synthesis: str, mcp_guidelines: str = None) -> str:
        system_prompt = (
            "Vous êtes un assistant médical d'orientation clinique préliminaire académique.\n"
            "En vous basant sur la synthèse clinique préliminaire fournie, proposez des recommandations intermédiaires générales et prudentes.\n"
            "RÈGLES IMPORTANTES :\n"
            "- Ne recommandez aucun médicament sur ordonnance.\n"
            "- Proposez uniquement des soins généraux comme : repos, hydratation, surveillance, et consultation médicale si les symptômes persistent ou s'aggravent.\n"
            "- Ne donnez pas de diagnostic définitif."
        )
        
        user_prompt = f"Synthèse clinique préliminaire :\n{synthesis}"
        if mcp_guidelines:
            user_prompt += f"\n\nGuidelines médicales de référence (à intégrer dans vos recommandations) :\n{mcp_guidelines}"

        try:
            return self._invoke_llm([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
        except Exception as e:
            print(f"❌ [LLM Error] Bascule sur la simulation locale : {e}")
            return self._fallback_interim_care(synthesis, mcp_guidelines)

    def _fallback_synthesis(self, chief_complaint: str, question_answers: list) -> str:
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
        return (
            f"--- Synthèse clinique préliminaire (Mode Simulation) ---\n"
            f"Plainte initiale : '{chief_complaint}'.\n"
            f"Détails cliniques collectés :\n{symptoms_str}\n"
            f"Analyse préliminaire : Les symptômes rapportés indiquent une orientation vers une affection respiratoire ou grippale légère à modérée. "
            f"Pas de signes de gravité extrême rapportés immédiatement, sous réserve d'évaluation médicale formelle."
        )

    def _fallback_interim_care(self, synthesis: str, mcp_guidelines: str = None) -> str:
        base_care = (
            "--- Recommandation intermédiaire (Mode Simulation) ---\n"
            "- Repos complet au calme.\n"
            "- Hydratation abondante régulière (eau, infusions).\n"
            "- Surveillance attentive de la température et de la respiration.\n"
            "- Consultation médicale sans tarder en cas de gêne respiratoire ou de détérioration de l'état général."
        )
        if mcp_guidelines:
            base_care += f"\n\nGuidelines de référence (MCP) :\n{mcp_guidelines}"
        return base_care

# Instantiate LLM Client singleton
llm_client = LLMClient()
