import sys
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("medical-guidelines")

@mcp.tool()
def medical_guidelines(symptom: str) -> str:
    """Get clinical recommendations for a patient symptom to guide interim care.
    
    Args:
        symptom: The name of the symptom (e.g., 'fever', 'cough', 'chest_pain').
    """
    s = symptom.lower().strip()
    
    # 1. Chest pain / Poitrine (Urgency)
    if any(keyword in s for keyword in ["chest", "poitrine", "thoracique", "coeur", "cœur", "cardiaque"]):
        return (
            "🚨 CONSULTATION URGENCE IMMÉDIATE (Risque cardiaque/pulmonaire).\n"
            "- Appeler immédiatement le 15 (SAMU) ou les urgences.\n"
            "- Rester au repos strict en position semi-assise.\n"
            "- Éviter tout effort physique ou stress émotionnel."
        )
        
    # 2. Breathing difficulty / Respiration (Urgency)
    elif any(keyword in s for keyword in ["breathing", "respiration", "respirer", "essoufflement", "dyspn", "toux sévère"]):
        return (
            "🚨 CONSULTATION URGENCE IMMÉDIATE.\n"
            "- S'asseoir bien droit pour libérer les voies respiratoires.\n"
            "- Limiter tout effort physique.\n"
            "- En cas d'asthme connu, utiliser l'inhalateur habituel.\n"
            "- Appeler le 15 (SAMU) en cas de détresse respiratoire ou d'aggravation rapide."
        )
        
    # 3. Fever / Fièvre
    elif any(keyword in s for keyword in ["fever", "fièvre", "fievre", "température", "temperature", "chaud"]):
        return (
            "💡 Recommandations Fièvre :\n"
            "- Hydratation abondante et régulière (eau, tisanes).\n"
            "- Repos complet au lit dans une pièce fraîche (18-20°C) et aérée.\n"
            "- Porter des vêtements légers.\n"
            "- Surveiller la température toutes les 4 heures.\n"
            "- Consulter un médecin si la température dépasse 39°C ou persiste plus de 48 heures."
        )
        
    # 4. Cough / Toux
    elif any(keyword in s for keyword in ["cough", "toux", "gorge", "rhume"]):
        return (
            "💡 Recommandations Toux / Mal de gorge :\n"
            "- Boire régulièrement des boissons chaudes (eau chaude, miel, citron).\n"
            "- Maintenir une bonne hydratation générale.\n"
            "- Humidifier l'air ambiant (surtout la nuit).\n"
            "- Surélever légèrement la tête du lit pour dormir.\n"
            "- Éviter les irritants (tabac, fumée).\n"
            "- Consulter en cas de difficultés à respirer, de crachats teintés de sang ou de persistance au-delà de 10 jours."
        )
        
    # 5. Headache / Maux de tête
    elif any(keyword in s for keyword in ["headache", "tête", "tete", "céphalée", "migraine"]):
        return (
            "💡 Recommandations Maux de tête :\n"
            "- Se reposer dans un endroit calme et sombre.\n"
            "- S'hydrater suffisamment.\n"
            "- Appliquer une compresse fraîche sur le front.\n"
            "- Éviter les écrans et les lumières vives.\n"
            "- Consulter immédiatement si le mal de tête est brutal ('coup de tonnerre'), accompagné d'une raideur de la nuque ou de vomissements."
        )
        
    # 6. Fatigue
    elif any(keyword in s for keyword in ["fatigue", "fatigu", "faiblesse"]):
        return (
            "💡 Recommandations Fatigue :\n"
            "- Privilégier un repos réparateur et un sommeil de qualité.\n"
            "- S'hydrater régulièrement et maintenir une alimentation équilibrée.\n"
            "- Éviter les efforts physiques intenses.\n"
            "- Consulter si la fatigue persiste sans cause apparente sur plusieurs semaines."
        )
        
    # Default Guidelines
    else:
        return (
            "💡 Recommandations Générales :\n"
            "- Repos physique et mental.\n"
            "- Hydratation régulière.\n"
            "- Surveillance attentive de l'apparition de nouveaux symptômes.\n"
            "- Consulter un professionnel de santé pour toute question médicale."
        )

if __name__ == "__main__":
    mcp.run()
