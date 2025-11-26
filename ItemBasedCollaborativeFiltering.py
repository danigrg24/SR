import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import json

class ItemBasedCollaborativeFiltering:
    """
    Item-Based Collaborative Filtering Implementation pentru Premier League Dataset
    
    Calculează similarități între item-uri (jucători) și generează recomandări Top-K
    pentru utilizatori pe baza preferințelor lor anterioare.
    """
    
    def __init__(self):
        self.user_item_matrix = None
        self.item_similarity_matrix = None
        self.players_data = None
        self.scaler = StandardScaler()
        
    def load_premier_league_data(self, csv_path='fbref_PL_2024-25.csv'):
        """
        Încarcă și procesează dataset-ul Premier League
        """
        try:
            # Citește dataset-ul
            self.players_data = pd.read_csv(csv_path)
            print(f"Loaded {len(self.players_data)} players from Premier League dataset")
            
            # Curăță și procesează datele
            self._preprocess_data()
            
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def _preprocess_data(self):
        """
        Curăță și normalizează datele pentru analiza CF
        """
        # Elimină duplicatele
        initial_count = len(self.players_data)
        self.players_data = self.players_data.drop_duplicates(
            subset=['Player', 'Squad', 'Pos', 'Age']
        ).reset_index(drop=True)
        
        print(f"Eliminated {initial_count - len(self.players_data)} duplicates")
        print(f"Processing {len(self.players_data)} unique players")
        
        # Completează valorile lipsă
        numeric_columns = ['Age', 'MP', 'Min', 'Gls', 'Ast', 'xG', 'xAG']
        for col in numeric_columns:
            if col in self.players_data.columns:
                self.players_data[col] = pd.to_numeric(self.players_data[col], errors='coerce').fillna(0)
        
        # Normalizează pozițiile
        if 'Pos' in self.players_data.columns:
            self.players_data['Position_Category'] = self.players_data['Pos'].apply(self._normalize_position)
    
    def _normalize_position(self, position):
        """
        Normalizează pozițiile în categorii standard
        """
        if pd.isna(position):
            return 'UNK'
        
        pos = str(position).upper()
        if 'GK' in pos:
            return 'GK'
        elif any(x in pos for x in ['DF', 'CB', 'LB', 'RB']):
            return 'DF'
        elif any(x in pos for x in ['MF', 'CM', 'DM', 'AM']):
            return 'MF'
        elif any(x in pos for x in ['FW', 'CF', 'LW', 'RW']):
            return 'FW'
        else:
            return 'MF'  # Default la midfielder
    
    def create_synthetic_user_interactions(self, num_users=50, interactions_per_user=10):
        """
        Creează interacțiuni sintetice user-item pentru demonstrație
        Simulează utilizatori care "aleg" jucători în fantasy football
        """
        num_players = len(self.players_data)
        
        # Creează matricea user-item
        user_item_matrix = np.zeros((num_users, num_players))
        
        # Pentru fiecare utilizator, generează interacțiuni bazate pe logică realistă
        for user_id in range(num_users):
            # Preferințe per echipă (unii utilizatori preferă anumite echipe)
            preferred_teams = np.random.choice(self.players_data['Squad'].unique(), 
                                             size=np.random.randint(1, 4), 
                                             replace=False)
            
            # Preferințe per poziție (unii utilizatori preferă atacanți, alții fundași)
            preferred_positions = np.random.choice(['GK', 'DF', 'MF', 'FW'], 
                                                 size=np.random.randint(1, 3), 
                                                 replace=False)
            
            # Selectează jucători bazat pe preferințe
            eligible_players = self.players_data[
                (self.players_data['Squad'].isin(preferred_teams)) |
                (self.players_data['Position_Category'].isin(preferred_positions))
            ].index.tolist()
            
            if len(eligible_players) < interactions_per_user:
                # Dacă nu sunt suficienți jucători eligibili, completează random
                remaining = list(set(range(num_players)) - set(eligible_players))
                eligible_players.extend(
                    np.random.choice(remaining, 
                                   size=interactions_per_user-len(eligible_players), 
                                   replace=False)
                )
            
            # Alege jucători pentru acest utilizator
            chosen_players = np.random.choice(eligible_players, 
                                            size=interactions_per_user, 
                                            replace=False)
            
            # Simulează rating-uri (0.1-1.0, cu focus pe jucători buni)
            for player_idx in chosen_players:
                player_rating = self._calculate_synthetic_rating(player_idx)
                user_item_matrix[user_id, player_idx] = player_rating
        
        self.user_item_matrix = user_item_matrix
        print(f"Created synthetic interactions: {num_users} users x {num_players} players")
        print(f"Total interactions: {np.count_nonzero(user_item_matrix)}")
        
        return user_item_matrix
    
    def _calculate_synthetic_rating(self, player_idx):
        """
        Calculează un rating sintetic realist pentru un jucător
        """
        player = self.players_data.iloc[player_idx]
        
        # Factori pentru rating
        base_rating = 0.5
        
        # Bonus pentru minute jucate (experiență)
        if player['Min'] > 1000:
            base_rating += 0.2
        elif player['Min'] > 500:
            base_rating += 0.1
        
        # Bonus pentru goluri și assist-uri
        if player['Gls'] + player['Ast'] > 10:
            base_rating += 0.2
        elif player['Gls'] + player['Ast'] > 5:
            base_rating += 0.1
        
        # Adaugă puțin zgomot random
        base_rating += np.random.normal(0, 0.1)
        
        # Limitează între 0.1 și 1.0
        return np.clip(base_rating, 0.1, 1.0)
    
    def compute_item_similarity_matrix(self):
        """
        Calculează matricea de similaritate item-item folosind cosine similarity
        """
        if self.user_item_matrix is None:
            raise ValueError("User-item matrix not created. Call create_synthetic_user_interactions first.")
        
        print("Computing item-item similarity matrix...")
        
        # Transpune matricea pentru a avea items pe rânduri
        item_user_matrix = self.user_item_matrix.T
        
        # Calculează cosine similarity între items
        self.item_similarity_matrix = cosine_similarity(item_user_matrix)
        
        print(f"Item similarity matrix computed: {self.item_similarity_matrix.shape}")
        
        return self.item_similarity_matrix
    
    def get_top_k_recommendations(self, user_id, k=5, min_similarity=0.1):
        """
        Calculează Top-K recomandări pentru un utilizator specific
        
        Args:
            user_id (int): ID-ul utilizatorului
            k (int): Numărul de recomandări de returnat
            min_similarity (float): Similaritatea minimă pentru a considera un item
            
        Returns:
            list: Lista cu Top-K recomandări
        """
        if self.user_item_matrix is None or self.item_similarity_matrix is None:
            raise ValueError("Matrices not computed. Call compute_item_similarity_matrix first.")
        
        user_ratings = self.user_item_matrix[user_id]
        num_items = len(user_ratings)
        
        # Calculează scorurile de predicție pentru toate item-urile
        predicted_scores = np.zeros(num_items)
        
        for item_idx in range(num_items):
            if user_ratings[item_idx] > 0:  # Utilizatorul a evaluat deja acest item
                predicted_scores[item_idx] = -1  # Exclude din recomandări
                continue
            
            # Găsește item-urile similare pe care utilizatorul le-a evaluat
            similar_items = []
            similarities = []
            
            for rated_item_idx in np.where(user_ratings > 0)[0]:
                similarity = self.item_similarity_matrix[item_idx, rated_item_idx]
                if similarity >= min_similarity:
                    similar_items.append(rated_item_idx)
                    similarities.append(similarity)
            
            if len(similar_items) > 0:
                # Calculează scorul ponderat
                similarities = np.array(similarities)
                user_ratings_similar = user_ratings[similar_items]
                
                predicted_score = np.sum(similarities * user_ratings_similar) / np.sum(similarities)
                predicted_scores[item_idx] = predicted_score
            else:
                predicted_scores[item_idx] = 0
        
        # Găsește Top-K items
        top_k_indices = np.argsort(predicted_scores)[::-1][:k]
        top_k_indices = top_k_indices[predicted_scores[top_k_indices] > 0]  # Exclude scorurile 0 sau negative
        
        # Construiește rezultatele
        recommendations = []
        for idx in top_k_indices:
            player = self.players_data.iloc[idx]
            recommendations.append({
                'player_id': idx,
                'player_name': player['Player'],
                'team': player['Squad'],
                'position': player['Position_Category'],
                'predicted_score': predicted_scores[idx],
                'goals': player['Gls'],
                'assists': player['Ast'],
                'minutes': player['Min']
            })
        
        return recommendations
    
    def analyze_user_preferences(self, user_id):
        """
        Analizează preferințele unui utilizator
        """
        if self.user_item_matrix is None:
            return None
        
        user_ratings = self.user_item_matrix[user_id]
        rated_items = np.where(user_ratings > 0)[0]
        
        if len(rated_items) == 0:
            return {"message": "User has no ratings"}
        
        # Analizează preferințele per echipă
        team_preferences = {}
        position_preferences = {}
        
        for item_idx in rated_items:
            player = self.players_data.iloc[item_idx]
            rating = user_ratings[item_idx]
            
            # Echipe
            team = player['Squad']
            if team not in team_preferences:
                team_preferences[team] = []
            team_preferences[team].append(rating)
            
            # Poziții
            position = player['Position_Category']
            if position not in position_preferences:
                position_preferences[position] = []
            position_preferences[position].append(rating)
        
        # Calculează mediile
        team_avg = {team: np.mean(ratings) for team, ratings in team_preferences.items()}
        position_avg = {pos: np.mean(ratings) for pos, ratings in position_preferences.items()}
        
        return {
            'total_rated_players': len(rated_items),
            'average_rating': np.mean(user_ratings[rated_items]),
            'favorite_teams': sorted(team_avg.items(), key=lambda x: x[1], reverse=True)[:3],
            'favorite_positions': sorted(position_avg.items(), key=lambda x: x[1], reverse=True),
            'top_rated_players': [
                {
                    'name': self.players_data.iloc[idx]['Player'],
                    'team': self.players_data.iloc[idx]['Squad'],
                    'rating': user_ratings[idx]
                }
                for idx in rated_items[np.argsort(user_ratings[rated_items])[::-1][:5]]
            ]
        }
    
    def get_item_similarity_analysis(self, player_name, top_k=10):
        """
        Analizează similaritatea pentru un jucător specific
        """
        if self.item_similarity_matrix is None:
            raise ValueError("Item similarity matrix not computed")
        
        # Găsește jucătorul
        player_idx = None
        for idx, row in self.players_data.iterrows():
            if pd.notna(row['Player']) and player_name.lower() in str(row['Player']).lower():
                player_idx = idx
                break
        
        if player_idx is None:
            return f"Player '{player_name}' not found"
        
        # Găsește cei mai similari jucători
        similarities = self.item_similarity_matrix[player_idx]
        similar_indices = np.argsort(similarities)[::-1][1:top_k+1]  # Exclude jucătorul însuși
        
        target_player = self.players_data.iloc[player_idx]
        similar_players = []
        
        for idx in similar_indices:
            if similarities[idx] > 0:
                similar_player = self.players_data.iloc[idx]
                similar_players.append({
                    'name': similar_player['Player'],
                    'team': similar_player['Squad'],
                    'position': similar_player['Position_Category'],
                    'similarity': similarities[idx],
                    'goals': similar_player['Gls'],
                    'assists': similar_player['Ast']
                })
        
        return {
            'target_player': {
                'name': target_player['Player'],
                'team': target_player['Squad'],
                'position': target_player['Position_Category'],
                'goals': target_player['Gls'],
                'assists': target_player['Ast']
            },
            'similar_players': similar_players
        }
    
    def generate_recommendation_report(self, user_id, k=10):
        """
        Generează un raport complet de recomandări pentru un utilizator
        """
        print(f"\n{'='*60}")
        print(f"ITEM-BASED CF RECOMMENDATION REPORT - USER {user_id}")
        print(f"{'='*60}")
        
        # Analizează preferințele utilizatorului
        preferences = self.analyze_user_preferences(user_id)
        
        print(f"\nUSER PREFERENCES ANALYSIS:")
        print(f"   Total rated players: {preferences['total_rated_players']}")
        print(f"   Average rating: {preferences['average_rating']:.3f}")
        
        print(f"\nFavorite Teams:")
        for team, avg_rating in preferences['favorite_teams']:
            print(f"   - {team}: {avg_rating:.3f}")
        
        print(f"\nFavorite Positions:")
        for position, avg_rating in preferences['favorite_positions']:
            print(f"   - {position}: {avg_rating:.3f}")
        
        print(f"\nTop Rated Players by User:")
        for player in preferences['top_rated_players']:
            print(f"   - {player['name']} ({player['team']}) - Rating: {player['rating']:.3f}")
        
        # Generează recomandările Top-K
        recommendations = self.get_top_k_recommendations(user_id, k)
        
        print(f"\nTOP-{k} RECOMMENDATIONS:")
        print(f"{'Rank':<4} | {'Player':<20} | {'Team':<15} | {'Pos':<3} | {'Score':<5} | {'G':<2} | {'A':<2}")
        print(f"{'-'*4}|{'-'*22}|{'-'*17}|{'-'*5}|{'-'*7}|{'-'*4}|{'-'*3}")
        
        for i, rec in enumerate(recommendations, 1):
            print(f"{i:<4} | {rec['player_name'][:18]:<20} | {rec['team'][:13]:<15} | "
                  f"{rec['position']:<3} | {rec['predicted_score']:.3f} | "
                  f"{rec['goals']:<2.0f} | {rec['assists']:<2.0f}")
        
        return recommendations

# Funcție principală pentru demonstrație
def main():
    """
    Funcția principală pentru demonstrarea algoritmului Item-Based CF
    """
    print("ITEM-BASED COLLABORATIVE FILTERING - PREMIER LEAGUE")
    print("="*60)
    
    # Inițializează sistemul
    cf_system = ItemBasedCollaborativeFiltering()
    
    # Încarcă datele
    if not cf_system.load_premier_league_data():
        print("Failed to load data. Make sure fbref_PL_2024-25.csv exists.")
        return
    
    # Creează interacțiuni sintetice
    cf_system.create_synthetic_user_interactions(num_users=30, interactions_per_user=12)
    
    # Calculează matricea de similaritate
    cf_system.compute_item_similarity_matrix()
    
    print(f"\nITEM SIMILARITY ANALYSIS EXAMPLES:")
    
    # Analizează similaritatea pentru câțiva jucători cunoscuți
    test_players = ['Haaland', 'Salah', 'Rice']
    for player in test_players:
        analysis = cf_system.get_item_similarity_analysis(player, top_k=5)
        if isinstance(analysis, dict):
            print(f"\nSimilar players to {analysis['target_player']['name']}:")
            for similar in analysis['similar_players'][:3]:
                print(f"   - {similar['name']} ({similar['team']}) - Similarity: {similar['similarity']:.3f}")
    
    # Generează rapoarte de recomandări pentru câțiva utilizatori
    print(f"\nRECOMMENDATION REPORTS:")
    for user_id in [0, 5, 10]:
        recommendations = cf_system.generate_recommendation_report(user_id, k=8)
    
    print(f"\nItem-Based Collaborative Filtering analysis completed!")
    print(f"Matrix dimensions: {cf_system.user_item_matrix.shape}")
    print(f"Item similarity matrix: {cf_system.item_similarity_matrix.shape}")

if __name__ == "__main__":
    main()