const fs = require('fs');
const csv = require('csv-parser');

/**
 * Item-Based Collaborative Filtering Implementation pentru Premier League Dataset
 * 
 * Calculează similarități între item-uri (jucători) și generează recomandări Top-K
 * pentru utilizatori pe baza preferințelor lor anterioare.
 */
class ItemBasedCollaborativeFiltering {
    constructor() {
        this.userItemMatrix = null;
        this.itemSimilarityMatrix = null;
        this.playersData = [];
    }

    /**
     * Încarcă și procesează dataset-ul Premier League
     */
    async loadPremierLeagueData(csvPath = 'fbref_PL_2024-25.csv') {
        return new Promise((resolve, reject) => {
            const players = [];
            
            // Citim CSV-ul manual pentru control complet
            const csvContent = fs.readFileSync(csvPath, 'utf8');
            const lines = csvContent.split('\n').filter(line => line.trim() !== '');
            
            // Sari peste header-ul și liniile de conflict
            const dataLines = lines.slice(1).filter(line => 
                !line.includes('<<<<<<< HEAD') && 
                !line.includes('=======') && 
                line.trim() !== ''
            );
            
            console.log(`Processing ${dataLines.length} data lines from CSV`);
            
            dataLines.forEach((line, index) => {
                const columns = line.split(',');
                
                // Skip liniile invalide
                if (columns.length < 25 || !columns[1] || !columns[4]) {
                    return;
                }
                
                const player = {
                    Rk: columns[0],
                    Player: columns[1],
                    Nation: columns[2],
                    Pos: columns[3],
                    Squad: columns[4],
                    Age: parseFloat(columns[5]) || 0,
                    Born: columns[6],
                    MP: parseFloat(columns[7]) || 0,
                    Starts: parseFloat(columns[8]) || 0,
                    Min: parseFloat(columns[9]) || 0,
                    '90s': parseFloat(columns[10]) || 0,
                    Gls: parseFloat(columns[11]) || 0,    // Coloana 12 = Goluri totale
                    Ast: parseFloat(columns[12]) || 0,    // Coloana 13 = Assist-uri totale
                    'G+A': parseFloat(columns[13]) || 0,
                    'G-PK': parseFloat(columns[14]) || 0,
                    PK: parseFloat(columns[15]) || 0,
                    PKatt: parseFloat(columns[16]) || 0,
                    CrdY: parseFloat(columns[17]) || 0,
                    CrdR: parseFloat(columns[18]) || 0,
                    xG: parseFloat(columns[19]) || 0,
                    npxG: parseFloat(columns[20]) || 0,
                    xAG: parseFloat(columns[21]) || 0
                };
                
                // Debug pentru jucători cunoscuți
                if (player.Player.includes('Haaland') || player.Player.includes('Salah') || player.Player.includes('Son')) {
                    console.log(`${player.Player}: Goals=${player.Gls}, Assists=${player.Ast}, Team=${player.Squad}`);
                }
                
                players.push(player);
            });
            
            console.log(`Loaded ${players.length} players from Premier League dataset`);
            this.playersData = players;
            this._preprocessData();
            resolve(true);
        });
    }

    /**
     * Curăță și normalizează datele pentru analiza CF
     */
    _preprocessData() {
        const initialCount = this.playersData.length;
        
        // Elimină duplicatele pe baza unei chei unice
        const uniquePlayers = [];
        const seenKeys = new Set();
        
        for (const player of this.playersData) {
            const key = `${player.Player}-${player.Squad}-${player.Pos}-${player.Age}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                // Normalizează poziția
                player.Position_Category = this._normalizePosition(player.Pos);
                uniquePlayers.push(player);
            }
        }
        
        this.playersData = uniquePlayers;
        console.log(`Eliminated ${initialCount - this.playersData.length} duplicates`);
        console.log(`Processing ${this.playersData.length} unique players`);
    }

    /**
     * Normalizează pozițiile în categorii standard
     */
    _normalizePosition(position) {
        if (!position) return 'UNK';
        
        const pos = position.toString().toUpperCase();
        if (pos.includes('GK')) return 'GK';
        if (['DF', 'CB', 'LB', 'RB'].some(p => pos.includes(p))) return 'DF';
        if (['MF', 'CM', 'DM', 'AM'].some(p => pos.includes(p))) return 'MF';
        if (['FW', 'CF', 'LW', 'RW'].some(p => pos.includes(p))) return 'FW';
        return 'MF'; // Default la midfielder
    }

    /**
     * Creează interacțiuni sintetice user-item pentru demonstrație
     */
    createSyntheticUserInteractions(numUsers = 50, interactionsPerUser = 10) {
        const numPlayers = this.playersData.length;
        
        // Creează matricea user-item
        this.userItemMatrix = Array(numUsers).fill().map(() => Array(numPlayers).fill(0));
        
        // Obține lista echipelor și pozițiilor unice
        const uniqueTeams = [...new Set(this.playersData.map(p => p.Squad))];
        const positions = ['GK', 'DF', 'MF', 'FW'];
        
        for (let userId = 0; userId < numUsers; userId++) {
            // Preferințe per echipă
            const numPreferredTeams = Math.floor(Math.random() * 3) + 1;
            const preferredTeams = this._randomSample(uniqueTeams, numPreferredTeams);
            
            // Preferințe per poziție
            const numPreferredPositions = Math.floor(Math.random() * 2) + 1;
            const preferredPositions = this._randomSample(positions, numPreferredPositions);
            
            // Selectează jucători eligibili
            const eligiblePlayers = [];
            this.playersData.forEach((player, index) => {
                if (preferredTeams.includes(player.Squad) || 
                    preferredPositions.includes(player.Position_Category)) {
                    eligiblePlayers.push(index);
                }
            });
            
            // Completează cu jucători random dacă nu sunt suficienți
            if (eligiblePlayers.length < interactionsPerUser) {
                const allIndices = Array.from({length: numPlayers}, (_, i) => i);
                const remaining = allIndices.filter(i => !eligiblePlayers.includes(i));
                const additionalPlayers = this._randomSample(
                    remaining, 
                    interactionsPerUser - eligiblePlayers.length
                );
                eligiblePlayers.push(...additionalPlayers);
            }
            
            // Alege jucători pentru acest utilizator
            const chosenPlayers = this._randomSample(eligiblePlayers, interactionsPerUser);
            
            // Simulează rating-uri
            chosenPlayers.forEach(playerIdx => {
                const rating = this._calculateSyntheticRating(playerIdx);
                this.userItemMatrix[userId][playerIdx] = rating;
            });
        }
        
        const totalInteractions = this.userItemMatrix
            .flat()
            .filter(rating => rating > 0).length;
        
        console.log(`Created synthetic interactions: ${numUsers} users x ${numPlayers} players`);
        console.log(`Total interactions: ${totalInteractions}`);
        
        return this.userItemMatrix;
    }

    /**
     * Utility function pentru sampling random
     */
    _randomSample(array, size) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, size);
    }

    /**
     * Calculează un rating sintetic realist pentru un jucător
     */
    _calculateSyntheticRating(playerIdx) {
        const player = this.playersData[playerIdx];
        let baseRating = 0.5;
        
        // Debug: Verifică valorile pentru primul jucător
        if (playerIdx < 5) {
            console.log(`Player ${playerIdx}: ${player.Player}, Goals: ${player.Gls}, Assists: ${player.Ast}, Minutes: ${player.Min}`);
        }
        
        // Bonus pentru minute jucate
        if (player.Min > 1000) baseRating += 0.2;
        else if (player.Min > 500) baseRating += 0.1;
        
        // Bonus pentru goluri și assist-uri
        const goalsAndAssists = (player.Gls || 0) + (player.Ast || 0);
        if (goalsAndAssists > 10) baseRating += 0.2;
        else if (goalsAndAssists > 5) baseRating += 0.1;
        
        // Adaugă zgomot random
        baseRating += (Math.random() - 0.5) * 0.2;
        
        // Limitează între 0.1 și 1.0
        return Math.max(0.1, Math.min(1.0, baseRating));
    }

    /**
     * Calculează matricea de similaritate item-item folosind cosine similarity
     */
    computeItemSimilarityMatrix() {
        if (!this.userItemMatrix) {
            throw new Error("User-item matrix not created. Call createSyntheticUserInteractions first.");
        }
        
        console.log("Computing item-item similarity matrix...");
        
        const numItems = this.playersData.length;
        this.itemSimilarityMatrix = Array(numItems).fill().map(() => Array(numItems).fill(0));
        
        // Calculează cosine similarity între toate perechile de jucători
        for (let i = 0; i < numItems; i++) {
            for (let j = 0; j < numItems; j++) {
                if (i === j) {
                    this.itemSimilarityMatrix[i][j] = 1.0;
                } else {
                    this.itemSimilarityMatrix[i][j] = this._cosineSimilarity(
                        this._getItemVector(i),
                        this._getItemVector(j)
                    );
                }
            }
        }
        
        console.log(`Item similarity matrix computed: ${numItems}x${numItems}`);
        return this.itemSimilarityMatrix;
    }

    /**
     * Extrage vectorul unui item din matricea user-item
     */
    _getItemVector(itemIndex) {
        return this.userItemMatrix.map(userRatings => userRatings[itemIndex]);
    }

    /**
     * Calculează cosine similarity între doi vectori
     */
    _cosineSimilarity(vectorA, vectorB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += vectorA[i] * vectorA[i];
            normB += vectorB[i] * vectorB[i];
        }
        
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Calculează Top-K recomandări pentru un utilizator specific
     */
    getTopKRecommendations(userId, k = 5, minSimilarity = 0.1) {
        if (!this.userItemMatrix || !this.itemSimilarityMatrix) {
            throw new Error("Matrices not computed. Call computeItemSimilarityMatrix first.");
        }
        
        const userRatings = this.userItemMatrix[userId];
        const numItems = userRatings.length;
        const predictedScores = Array(numItems).fill(0);
        
        for (let itemIdx = 0; itemIdx < numItems; itemIdx++) {
            if (userRatings[itemIdx] > 0) {
                predictedScores[itemIdx] = -1; // Exclude din recomandări
                continue;
            }
            
            // Găsește item-urile similare pe care utilizatorul le-a evaluat
            const similarItems = [];
            const similarities = [];
            
            for (let ratedItemIdx = 0; ratedItemIdx < numItems; ratedItemIdx++) {
                if (userRatings[ratedItemIdx] > 0) {
                    const similarity = this.itemSimilarityMatrix[itemIdx][ratedItemIdx];
                    if (similarity >= minSimilarity) {
                        similarItems.push(ratedItemIdx);
                        similarities.push(similarity);
                    }
                }
            }
            
            if (similarItems.length > 0) {
                // Calculează scorul ponderat
                let numerator = 0;
                let denominator = 0;
                
                for (let i = 0; i < similarItems.length; i++) {
                    const simIdx = similarItems[i];
                    const sim = similarities[i];
                    numerator += sim * userRatings[simIdx];
                    denominator += sim;
                }
                
                predictedScores[itemIdx] = numerator / denominator;
            }
        }
        
        // Găsește Top-K items
        const indexedScores = predictedScores
            .map((score, index) => ({ index, score }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, k);
        
        // Construiește rezultatele
        return indexedScores.map(item => {
            const player = this.playersData[item.index];
            return {
                player_id: item.index,
                player_name: player.Player,
                team: player.Squad,
                position: player.Position_Category,
                predicted_score: item.score,
                goals: player.Gls,
                assists: player.Ast,
                minutes: player.Min
            };
        });
    }

    /**
     * Analizează preferințele unui utilizator
     */
    analyzeUserPreferences(userId) {
        if (!this.userItemMatrix) return null;
        
        const userRatings = this.userItemMatrix[userId];
        const ratedItems = [];
        
        userRatings.forEach((rating, index) => {
            if (rating > 0) ratedItems.push({ index, rating });
        });
        
        if (ratedItems.length === 0) {
            return { message: "User has no ratings" };
        }
        
        // Analizează preferințele per echipă și poziție
        const teamPreferences = {};
        const positionPreferences = {};
        
        ratedItems.forEach(item => {
            const player = this.playersData[item.index];
            
            // Echipe
            if (!teamPreferences[player.Squad]) {
                teamPreferences[player.Squad] = [];
            }
            teamPreferences[player.Squad].push(item.rating);
            
            // Poziții
            if (!positionPreferences[player.Position_Category]) {
                positionPreferences[player.Position_Category] = [];
            }
            positionPreferences[player.Position_Category].push(item.rating);
        });
        
        // Calculează mediile
        const teamAvg = Object.entries(teamPreferences)
            .map(([team, ratings]) => [team, ratings.reduce((a, b) => a + b) / ratings.length])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        const positionAvg = Object.entries(positionPreferences)
            .map(([pos, ratings]) => [pos, ratings.reduce((a, b) => a + b) / ratings.length])
            .sort((a, b) => b[1] - a[1]);
        
        const averageRating = ratedItems.reduce((sum, item) => sum + item.rating, 0) / ratedItems.length;
        
        const topRatedPlayers = ratedItems
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5)
            .map(item => {
                const player = this.playersData[item.index];
                return {
                    name: player.Player,
                    team: player.Squad,
                    rating: item.rating
                };
            });
        
        return {
            total_rated_players: ratedItems.length,
            average_rating: averageRating,
            favorite_teams: teamAvg,
            favorite_positions: positionAvg,
            top_rated_players: topRatedPlayers
        };
    }

    /**
     * Analizează similaritatea pentru un jucător specific
     */
    getItemSimilarityAnalysis(playerName, topK = 10) {
        if (!this.itemSimilarityMatrix) {
            throw new Error("Item similarity matrix not computed");
        }
        
        // Găsește jucătorul
        const playerIdx = this.playersData.findIndex(player => 
            player.Player && player.Player.toLowerCase().includes(playerName.toLowerCase())
        );
        
        if (playerIdx === -1) {
            return `Player '${playerName}' not found`;
        }
        
        // Găsește cei mai similari jucători
        const similarities = this.itemSimilarityMatrix[playerIdx];
        const similarPlayers = similarities
            .map((sim, index) => ({ index, similarity: sim }))
            .filter(item => item.index !== playerIdx && item.similarity > 0)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK)
            .map(item => {
                const player = this.playersData[item.index];
                return {
                    name: player.Player,
                    team: player.Squad,
                    position: player.Position_Category,
                    similarity: item.similarity,
                    goals: player.Gls,
                    assists: player.Ast
                };
            });
        
        const targetPlayer = this.playersData[playerIdx];
        return {
            target_player: {
                name: targetPlayer.Player,
                team: targetPlayer.Squad,
                position: targetPlayer.Position_Category,
                goals: targetPlayer.Gls,
                assists: targetPlayer.Ast
            },
            similar_players: similarPlayers
        };
    }

    /**
     * Generează un raport complet de recomandări pentru un utilizator
     */
    generateRecommendationReport(userId, k = 10) {
        console.log("\n" + "=".repeat(60));
        console.log(`ITEM-BASED CF RECOMMENDATION REPORT - USER ${userId}`);
        console.log("=".repeat(60));
        
        // Analizează preferințele utilizatorului
        const preferences = this.analyzeUserPreferences(userId);
        
        console.log("\nUSER PREFERENCES ANALYSIS:");
        console.log(`   Total rated players: ${preferences.total_rated_players}`);
        console.log(`   Average rating: ${preferences.average_rating.toFixed(3)}`);
        
        console.log("\nFavorite Teams:");
        preferences.favorite_teams.forEach(([team, rating]) => {
            console.log(`   - ${team}: ${rating.toFixed(3)}`);
        });
        
        console.log("\nFavorite Positions:");
        preferences.favorite_positions.forEach(([position, rating]) => {
            console.log(`   - ${position}: ${rating.toFixed(3)}`);
        });
        
        console.log("\nTop Rated Players by User:");
        preferences.top_rated_players.forEach(player => {
            console.log(`   - ${player.name} (${player.team}) - Rating: ${player.rating.toFixed(3)}`);
        });
        
        // Generează recomandările Top-K
        const recommendations = this.getTopKRecommendations(userId, k);
        
        console.log(`\nTOP-${k} RECOMMENDATIONS:`);
        console.log("Rank | Player               | Team            | Pos | Score | G  | A ");
        console.log("-".repeat(4) + "|" + "-".repeat(22) + "|" + "-".repeat(17) + "|" + "-".repeat(5) + "|" + "-".repeat(7) + "|" + "-".repeat(4) + "|" + "-".repeat(3));
        
        recommendations.forEach((rec, index) => {
            const rank = (index + 1).toString().padEnd(4);
            const name = rec.player_name.substring(0, 18).padEnd(20);
            const team = rec.team.substring(0, 13).padEnd(15);
            const pos = rec.position.padEnd(3);
            const score = rec.predicted_score.toFixed(3);
            const goals = Math.round(rec.goals).toString().padEnd(2);
            const assists = Math.round(rec.assists).toString().padEnd(2);
            
            console.log(`${rank} | ${name} | ${team} | ${pos} | ${score} | ${goals} | ${assists}`);
        });
        
        return recommendations;
    }
}

/**
 * Funcția principală pentru demonstrarea algoritmului Item-Based CF
 */
async function main() {
    console.log("ITEM-BASED COLLABORATIVE FILTERING - PREMIER LEAGUE");
    console.log("=".repeat(60));
    
    try {
        // Inițializează sistemul
        const cfSystem = new ItemBasedCollaborativeFiltering();
        
        // Încarcă datele
        const dataLoaded = await cfSystem.loadPremierLeagueData();
        if (!dataLoaded) {
            console.log("Failed to load data. Make sure fbref_PL_2024-25.csv exists.");
            return;
        }
        
        // Creează interacțiuni sintetice
        cfSystem.createSyntheticUserInteractions(30, 12);
        
        // Calculează matricea de similaritate
        cfSystem.computeItemSimilarityMatrix();
        
        console.log("\nITEM SIMILARITY ANALYSIS EXAMPLES:");
        
        // Analizează similaritatea pentru câțiva jucători cunoscuți
        const testPlayers = ['Haaland', 'Salah', 'Rice'];
        for (const player of testPlayers) {
            try {
                const analysis = cfSystem.getItemSimilarityAnalysis(player, 5);
                if (typeof analysis === 'object') {
                    console.log(`\nSimilar players to ${analysis.target_player.name}:`);
                    analysis.similar_players.slice(0, 3).forEach(similar => {
                        console.log(`   - ${similar.name} (${similar.team}) - Similarity: ${similar.similarity.toFixed(3)}`);
                    });
                }
            } catch (error) {
                console.log(`   Could not analyze ${player}: ${error.message}`);
            }
        }
        
        // Generează rapoarte de recomandări pentru câțiva utilizatori
        console.log("\nRECOMMENDATION REPORTS:");
        [0, 5, 10].forEach(userId => {
            cfSystem.generateRecommendationReport(userId, 8);
        });
        
        console.log("\nItem-Based Collaborative Filtering analysis completed!");
        console.log(`Matrix dimensions: ${cfSystem.userItemMatrix.length}x${cfSystem.userItemMatrix[0].length}`);
        console.log(`Item similarity matrix: ${cfSystem.itemSimilarityMatrix.length}x${cfSystem.itemSimilarityMatrix[0].length}`);
        
    } catch (error) {
        console.error("Error during execution:", error);
    }
}

// Export pentru utilizare ca modul
module.exports = ItemBasedCollaborativeFiltering;

// Rulează funcția principală dacă fișierul este executat direct
if (require.main === module) {
    main();
}