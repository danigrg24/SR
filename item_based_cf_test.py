import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------
# LABORATOR 5: Item-Based Collaborative Filtering
# Calculul Top-K Recomandări pentru Premier League Dataset
# ---------------------------

class SimpleItemBasedCF:
    """
    Implementare simplificată pentru demonstrarea conceptelor de bază
    """
    
    def __init__(self):
        self.user_item_matrix = None
        self.item_similarity_matrix = None
        self.item_names = None
        
    def create_demo_matrix(self):
        """
        Creează o matrice demo pentru demonstrarea conceptelor
        """
        # Matrice User-Item simplificată
        # Rânduri = Utilizatori, Coloane = Jucători
        # Valorile: 0 = nu a fost ales, 1 = a fost ales
        self.user_item_matrix = np.array([
            [1, 1, 0, 0, 1, 0],  # User 0: alege jucătorii 0, 1, 4
            [1, 0, 1, 0, 0, 1],  # User 1: alege jucătorii 0, 2, 5
            [0, 1, 1, 1, 0, 0],  # User 2: alege jucătorii 1, 2, 3
            [0, 0, 1, 1, 1, 1],  # User 3: alege jucătorii 2, 3, 4, 5
        ])
        
        # Numele jucătorilor pentru demonstrație
        self.item_names = [
            "Haaland (Man City, FW)",
            "Salah (Liverpool, FW)", 
            "Rice (Arsenal, MF)",
            "van Dijk (Liverpool, DF)",
            "De Bruyne (Man City, MF)",
            "Saka (Arsenal, FW)"
        ]
        
        print("Demo User-Item Matrix:")
        print("Users\\Players:", [name.split()[0] for name in self.item_names])
        for i, row in enumerate(self.user_item_matrix):
            print(f"User {i}:        {row}")
        
        return self.user_item_matrix
    
    def compute_item_similarity(self):
        """
        Calculează matricea de similaritate item-item
        """
        # Transpune matricea pentru a avea item-urile pe rânduri
        item_user_matrix = self.user_item_matrix.T
        
        # Calculează cosine similarity
        self.item_similarity_matrix = cosine_similarity(item_user_matrix)
        
        print(f"\nItem-Item Similarity Matrix ({len(self.item_names)}x{len(self.item_names)}):")
        print("Items:", [name.split()[0] for name in self.item_names])
        for i, row in enumerate(self.item_similarity_matrix):
            player_name = self.item_names[i].split()[0]
            formatted_row = [f"{val:.2f}" for val in row]
            print(f"{player_name:8}: {formatted_row}")
        
        return self.item_similarity_matrix
    
    def get_top_k_recommendations(self, user_id, k=3):
        """
        Calculează Top-K recomandări pentru un utilizator
        """
        print(f"\nTOP-{k} RECOMMENDATIONS FOR USER {user_id}:")
        print("="*50)
        
        user_ratings = self.user_item_matrix[user_id]
        print(f"User {user_id} current choices: {np.where(user_ratings == 1)[0].tolist()}")
        print(f"User {user_id} liked players: {[self.item_names[i].split()[0] for i in np.where(user_ratings == 1)[0]]}")
        
        num_items = len(user_ratings)
        predicted_scores = np.zeros(num_items)
        
        # Pentru fiecare jucător pe care utilizatorul nu l-a ales încă
        for item_idx in range(num_items):
            if user_ratings[item_idx] == 1:  # Deja ales
                predicted_scores[item_idx] = -1  # Exclude din recomandări
                continue
            
            # Găsește jucătorii similari pe care utilizatorul i-a ales
            numerator = 0
            denominator = 0
            
            for liked_item_idx in np.where(user_ratings == 1)[0]:
                similarity = self.item_similarity_matrix[item_idx, liked_item_idx]
                numerator += similarity * user_ratings[liked_item_idx]  # În acest caz rating = 1
                denominator += abs(similarity)
            
            if denominator > 0:
                predicted_scores[item_idx] = numerator / denominator
            
            print(f"\nPlayer {item_idx} ({self.item_names[item_idx].split()[0]}):")
            print(f"  Similarities with liked players: {[f'{self.item_similarity_matrix[item_idx, j]:.3f}' for j in np.where(user_ratings == 1)[0]]}")
            print(f"  Predicted score: {predicted_scores[item_idx]:.3f}")
        
        # Găsește Top-K items
        eligible_items = np.where(predicted_scores >= 0)[0]
        if len(eligible_items) == 0:
            print("\nNo recommendations found!")
            return []
        
        top_k_indices = eligible_items[np.argsort(predicted_scores[eligible_items])[::-1][:k]]
        
        print(f"\nTOP-{k} RECOMMENDATIONS:")
        recommendations = []
        for i, idx in enumerate(top_k_indices, 1):
            player_info = self.item_names[idx]
            score = predicted_scores[idx]
            print(f"{i}. {player_info} - Score: {score:.3f}")
            recommendations.append({
                'rank': i,
                'player': player_info,
                'score': score
            })
        
        return recommendations

def demonstrate_item_based_cf():
    """
    Funcția principală pentru demonstrația algoritmului
    """
    print("ITEM-BASED COLLABORATIVE FILTERING DEMONSTRATION")
    print("=" * 60)
    print("Simulăm un sistem de recomandări pentru Fantasy Football")
    print("Users aleg jucători, algoritmul recomandă alți jucători similari\n")
    
    # Inițializează sistemul
    cf_system = SimpleItemBasedCF()
    
    # Creează matricea demo
    cf_system.create_demo_matrix()
    
    # Calculează similaritățile
    cf_system.compute_item_similarity()
    
    # Analizează similaritățile
    print(f"\nSIMILARITY ANALYSIS:")
    print("Haaland este similar cu:")
    haaland_similarities = cf_system.item_similarity_matrix[0]  # Haaland este item 0
    for i, sim in enumerate(haaland_similarities):
        if i != 0 and sim > 0.1:  # Exclude pe Haaland însuși
            print(f"  - {cf_system.item_names[i]}: {sim:.3f}")
    
    # Generează recomandări pentru fiecare utilizator
    for user_id in range(len(cf_system.user_item_matrix)):
        recommendations = cf_system.get_top_k_recommendations(user_id, k=2)
    
    print(f"\nDemonstrația Item-Based CF completă!")

# Testează și implementarea completă cu dataset-ul real
def test_with_real_data():
    """
    Test cu dataset-ul real Premier League
    """
    print(f"\n" + "="*60)
    print("TESTING WITH REAL PREMIER LEAGUE DATA")
    print("="*60)
    
    try:
        from ItemBasedCollaborativeFiltering import ItemBasedCollaborativeFiltering
        
        # Inițializează sistemul complet
        cf_system = ItemBasedCollaborativeFiltering()
        
        # Încarcă datele reale
        if cf_system.load_premier_league_data():
            # Creează interacțiuni pentru demo
            cf_system.create_synthetic_user_interactions(num_users=10, interactions_per_user=8)
            
            # Calculează similaritățile
            cf_system.compute_item_similarity_matrix()
            
            print(f"\nREAL DATA RECOMMENDATIONS (User 0):")
            recommendations = cf_system.get_top_k_recommendations(user_id=0, k=5)
            
            for i, rec in enumerate(recommendations, 1):
                print(f"{i}. {rec['player_name']} ({rec['team']}, {rec['position']}) - Score: {rec['predicted_score']:.3f}")
            
            print(f"\nReal data test completed successfully!")
        else:
            print("Could not load Premier League data")
            
    except ImportError:
        print("Could not import full implementation. Make sure all dependencies are installed.")

if __name__ == "__main__":
    # Demonstrația principală
    demonstrate_item_based_cf()
    
    # Test cu date reale
    test_with_real_data()