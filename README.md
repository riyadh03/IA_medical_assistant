# Diagnostic Médical — Système Multi-Agents avec LangGraph

**Projet :** Système multi-agents médical pour l'orientation clinique
**Cadre Pédagogique :** Université (S8) — Agentic AI / Pr. Mohamed YOUSSFI
**Technologies Cibles :** LangGraph, LangChain, FastAPI, Model Context Protocol (MCP), React/Angular/Flutter/Streamlit

---

> [!WARNING]
> **Cadre Pédagogique et Éthique Obligatoire :**
> - Ce projet est un exercice académique et le système **ne doit pas** être présenté comme un dispositif médical ni fournir de diagnostic définitif.
> - Les termes recommandés à utiliser sont : **orientation clinique préliminaire**, **synthèse clinique**, et **recommandation intermédiaire**.
> - Le rapport final doit obligatoirement mentionner la clause de non-responsabilité suivante :  
>   *« Ce système ne remplace pas une consultation médicale. »*

---

## 📖 Table des Matières
1. [Contexte & Objectifs](#-contexte--objectifs)
2. [Architecture du Système](#-architecture-du-système)
3. [Structure de l'État Partagé (State)](#-structure-de-létat-partagé-state)
4. [Intégration du Protocole MCP](#-intégration-du-protocole-mcp)
5. [Spécifications de l'API FastAPI](#-spécifications-de-lapi-fastapi)
6. [Interface Utilisateur (Frontend)](#-interface-utilisateur-frontend)
7. [Feuille de Route (5 Sprints de Développement)](#-feuille-de-route-5-sprints-de-développement)
8. [Guide d'Installation et Exécution](#-guide-dinstallation-et-exécution)

---

## 🎯 Contexte & Objectifs

Le but de ce projet est de concevoir et développer une application multi-agents basée sur **LangGraph** simulant un workflow d'orientation clinique. Le système recueille les informations du patient, produit une synthèse clinique préliminaire enrichie par des guidelines via MCP, intègre une validation humaine (Human-in-the-Loop) par un médecin traitant, puis génère un rapport final structuré.

### Objectifs d'apprentissage
- **Modélisation multi-agents** et contrôle de flux avec LangGraph.
- **Gestion de l'état partagé** (State) entre agents avec LangGraph.
- **Human-in-the-Loop** : mise en place d'une interruption pour la validation médicale.
- **MCP (Model Context Protocol)** : création et appel d'un outil externe de recommandations.
- **API Rest** : exposition du graphe sous forme d'API structurée avec FastAPI.
- **Interface UI** : développement d'un frontend réactif connecté à l'API.
- **Studio de débogage** : visualisation et test dans LangGraph Studio.

---

## 🏗️ Architecture du Système

### Flux de Contrôle (Workflow Minimal)

```mermaid
graph TD
    START([START]) --> Supervisor{Supervisor Agent}
    
    Supervisor -->|next: diagnostic_agent| DiagnosticAgent[Diagnostic Agent]
    DiagnosticAgent -->|Tool: ask_patient| PatientLoop{5 Questions Loop?}
    PatientLoop -->|Non complété| DiagnosticAgent
    PatientLoop -->|Complété| InterimCare[Tool: recommend_interim_care]
    InterimCare --> Supervisor
    
    Supervisor -->|next: physician_review| PhysicianReview[Physician Review Node <br>HITL Interrupt]
    PhysicianReview -->|Resume with Treatment| Supervisor
    
    Supervisor -->|next: report_agent| ReportAgent[Report Agent]
    ReportAgent --> Supervisor
    
    Supervisor -->|next: FINISH| END([END])

    style PhysicianReview fill:#f9f,stroke:#333,stroke-width:2px
```

### Agents Obligatoires
1. **Supervisor** : Orchestre le workflow et prend la décision de la prochaine étape à exécuter en fonction de l'état.
2. **Diagnostic Agent** : Pose exactement 5 questions de suivi au patient, réalise une pré-analyse et produit une synthèse clinique préliminaire.
3. **Physician Review** : Étape Human-in-the-Loop (HITL) représentant le médecin traitant. Elle interrompt le graphe pour recueillir l'avis médical.
4. **Report Agent** : Génère le rapport final structuré incluant les avertissements éthiques.

---

## 💾 Structure de l'État Partagé (State)

L'état partagé entre les agents est modélisé sous la structure suivante (`MedicalState`) :

```python
from typing import Annotated, List
from typing_extensions import TypedDict, Literal
from langgraph.graph.message import add_messages

class MedicalState(TypedDict, total=False):
    # Identifiants et informations patient
    workflow_id: str
    patient_name: str
    patient_age: int
    patient_gender: str
    chief_complaint: str  # Plainte initiale
    
    # Historique conversationnel
    messages: Annotated[list, add_messages]
    
    # Indicateurs de progression
    next: Literal["diagnostic_agent", "physician_review", "report_agent", "FINISH"]
    question_count: int
    question_answers: List[dict]  # Liste des Q/A du patient
    
    # Résultats des étapes
    diagnostic_summary: str      # Synthèse clinique préliminaire
    interim_care: str            # Recommandations d'urgence / temporaires
    physician_review: str        # Traitement / Conduite à tenir saisie par le médecin
    final_report: str            # Rapport final complet structuré
    status: str                  # Statut du workflow (running, waiting_patient, waiting_physician, completed)
```

---

## 🔌 Intégration du Protocole MCP

L'utilisation du **Model Context Protocol (MCP)** est intégrée pour fournir aux agents des informations de référence (guidelines médicales).
- **mcp_server/server.py** : Un serveur MCP qui expose l'outil `medical_guidelines(symptom: str)`.
- **Exemple de retour** : Pour `symptom="fever"`, l'outil renvoie : *« Hydratation abondante, repos au lit, surveillance de la température toutes les 4h, consultation si > 39°C ou persistance > 48h. »*
- Le **Diagnostic Agent** interroge ce serveur MCP pour enrichir son traitement des recommandations temporaires.

---

## ⚡ Spécifications de l'API FastAPI

Le backend expose des endpoints REST pour interagir de façon asynchrone avec le graphe et gérer les états d'interruption :

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/consultation/start` | Initialise la session avec les informations du patient (`name`, `age`, `gender`, `chief_complaint`). |
| `POST` | `/consultation/{workflow_id}/answer` | Enregistre une réponse du patient à la question courante et avance le graphe. |
| `POST` | `/consultation/{workflow_id}/physician-review` | Permet au médecin de soumettre ses instructions cliniques (reprise du HITL). |
| `GET` | `/consultation/{workflow_id}` | Récupère l'état actuel de la consultation (questions en cours, statut, etc.). |
| `GET` | `/consultation/{workflow_id}/report` | Récupère le rapport final généré pour la consultation spécifiée. |

---

## 💻 Interface Utilisateur (Frontend)

L'interface doit permettre de gérer la consultation à travers **4 écrans minimaux** :

1. **Écran 1 — Admission & Cas Initial** : Saisie du nom, de l'âge, du genre et de la plainte initiale du patient.
2. **Écran 2 — Questions/Réponses Patient** : Affichage dynamique des 5 questions du Diagnostic Agent successives avec champ de saisie pour le patient.
3. **Écran 3 — Espace Médecin (HITL)** : Affichage de la synthèse clinique et de la recommandation intermédiaire. Formulaire de saisie pour le médecin traitant (traitement ou conduite à tenir) afin de valider et relancer le flux.
4. **Écran 4 — Rapport Final** : Affichage du rapport structuré généré par le `Report Agent` avec les clauses éthiques requises.

---

## 🚀 Feuille de Route (5 Sprints de Développement)

Ce projet est planifié en **5 Sprints** progressifs, chacun débouchant sur un livrable testable :

### 🏃 Sprint 1 : Cœur du système (LangGraph & Supervisor)
* **Objectif :** Obtenir un squelette de workflow fonctionnel dans le terminal.
* **Tâches :**
  - Configurer `MedicalState`.
  - Implémenter les nœuds de base : `Supervisor`, `Diagnostic Agent`, `Report Agent`.
  - Relier le graphe minimal : `START -> Supervisor -> DiagnosticAgent -> ReportAgent -> END`.
* **Livrable :** Script fonctionnel `python app/graph.py` qui simule le flux complet dans la console.

### 🏃 Sprint 2 : Agent conversationnel & LLM (OpenAI/LangChain)
* **Objectif :** Mettre en place la boucle interactive de 5 questions patient.
* **Tâches :**
  - Intégrer `ChatOpenAI` ou LLM compatible dans le `Diagnostic Agent`.
  - Implémenter l'outil `ask_patient` et le mécanisme de comptage des questions.
  - Implémenter la génération automatique de la synthèse clinique préliminaire et de l'interim care à partir des réponses récoltées.
* **Livrable :** Scénario de terminal complet : plainte initiale -> 5 questions -> synthèse clinique.

### 🏃 Sprint 3 : Human-in-the-Loop (HITL)
* **Objectif :** Mettre en place l'interruption pour le médecin traitant.
* **Tâches :**
  - Ajouter le nœud `Physician Review`.
  - Configurer l'interruption via `interrupt()` dans LangGraph lors de la transition vers le médecin.
  - Permettre la reprise du graphe après l'envoi de la décision du médecin.
* **Livrable :** Flux LangGraph complet avec pause éthique et reprise.

### 🏃 Sprint 4 : API FastAPI & Persistance SQLite
* **Objectif :** Rendre le système accessible via une API Rest persistée.
* **Tâches :**
  - Créer la base de données SQLite et la table `workflow` pour stocker l'état des consultations.
  - Implémenter les endpoints FastAPI (`/consultation/start`, `/answer`, `/physician-review`, etc.).
  - Documenter l'API via Swagger UI (`/docs`).
* **Livrable :** API FastAPI fonctionnelle et entièrement testable via Swagger ou Postman.

### 🏃 Sprint 5 : Frontend, MCP et Finalisation
* **Objectif :** Intégrer l'interface utilisateur, le protocole MCP et peaufiner les livrables.
* **Tâches :**
  - Connecter le frontend (React, Angular, Flutter, ou Streamlit) aux API FastAPI.
  - Développer et lancer le serveur MCP (`mcp_server/server.py`) fournissant les guidelines.
  - Brancher l'outil MCP sur le Diagnostic Agent.
  - Préparer la configuration Docker Compose pour lancer backend, frontend et mcp_server conjointement.
  - Effectuer les tests et démonstrations dans LangGraph Studio.
* **Livrable :** Application complète, conteneurisée, prête pour démonstration.

---

## 🛠️ Guide d'Installation et Exécution

### Prérequis
- Python 3.10+
- Node.js (si frontend React/Angular)
- Clé API OpenAI (configurée dans un fichier `.env` ou variable d'environnement)

### Configuration locale rapide

1. **Cloner le projet et configurer le backend** :
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Ou venv\Scripts\activate sous Windows
   pip install -r requirements.txt
   ```

2. **Lancer le serveur API** :
   ```bash
   # Depuis le dossier backend/
   uvicorn app.api:app --reload --port 8000
   ```

3. **Lancer le serveur MCP** :
   ```bash
   cd ../mcp_server
   python server.py
   ```

4. **Lancer l'interface utilisateur (Streamlit/React)** :
   ```bash
   cd ../frontend
   # Commandes adaptées selon la technologie retenue (ex: npm run dev ou streamlit run app.py)
   ```

5. **Exécution Docker-compose** :
   ```bash
   docker-compose up --build
   ```
