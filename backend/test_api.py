import requests
import json
import time

BASE_URL = "http://localhost:8080/consultation"

def test_api_workflow():
    print("🚀 Démarrage du test d'intégration de l'API FastAPI (sur le port 8080)...")
    
    # 1. Start consultation
    patient_data = {
        "patient_name": "Sarah Connor",
        "patient_age": 29,
        "patient_gender": "Féminin",
        "chief_complaint": "Toux sèche persistante et légère fatigue depuis 4 jours."
    }
    
    print("\n1. Démarrage de la consultation...")
    res = requests.post(f"{BASE_URL}/start", json=patient_data)
    if res.status_code != 200:
        print(f"❌ Échec de /start: {res.text}")
        return
        
    data = res.json()
    workflow_id = data["workflow_id"]
    next_question = data["next_question"]
    print(f"✅ Consultation démarrée avec ID : {workflow_id}")
    print(f"💬 Première question reçue : '{next_question}'")
    
    # 2. Answer the 5 questions
    answers = [
        "Depuis environ 4 jours, ça a commencé après une randonnée.",
        "Non, pas de fièvre, ma température est à 36.8°C.",
        "Oui, surtout une toux sèche irritante sans maux de gorge.",
        "Non, aucune difficulté respiratoire à l'effort.",
        "Je ne prends aucun traitement actuellement."
    ]
    
    current_status = data["status"]
    
    for idx, answer in enumerate(answers):
        print(f"\n2.{idx+1} Envoi de la réponse : '{answer}'")
        res = requests.post(f"{BASE_URL}/{workflow_id}/answer", json={"answer": answer})
        if res.status_code != 200:
            print(f"❌ Échec de /answer: {res.text}")
            return
            
        data = res.json()
        current_status = data["status"]
        
        if data.get("next_question"):
            print(f"💬 Question suivante : '{data['next_question']}'")
        else:
            print(f"✨ Toutes les questions ont été répondues. Statut : {current_status}")
            print(f"📋 Synthèse clinique générée :\n{data.get('diagnostic_summary')}")
            print(f"💡 Recommandation temporaire :\n{data.get('interim_care')}")
            break
            
    # 3. Submit physician review (Human-in-the-Loop)
    print("\n3. Envoi de l'avis et traitement du médecin traitant...")
    physician_review = "Repos recommandé, hydratation régulière, tisane miel-citron pour calmer la toux, surveillance pendant 48h."
    
    res = requests.post(
        f"{BASE_URL}/{workflow_id}/physician-review",
        json={"physician_review": physician_review}
    )
    if res.status_code != 200:
        print(f"❌ Échec de /physician-review: {res.text}")
        return
        
    data = res.json()
    print("✅ Avis médecin soumis et rapport final généré !")
    
    # 4. Fetch complete consultation status from SQLite database
    print("\n4. Récupération du statut complet depuis SQLite...")
    res = requests.get(f"{BASE_URL}/{workflow_id}")
    if res.status_code != 200:
        print(f"❌ Échec de GET /{workflow_id}: {res.text}")
        return
        
    status_data = res.json()
    print(f"📊 Statut de la consultation en base : {status_data['status']}")
    print(f"📝 Nombre de réponses enregistrées : {len(status_data['question_answers'])}")
    print(f"📋 Rapport Final en base :\n{status_data['final_report']}")
    print("\n🎉 Test d'intégration API complété avec SUCCÈS !")

if __name__ == "__main__":
    test_api_workflow()
