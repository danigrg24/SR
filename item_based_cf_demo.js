/**
 * Demonstrație simplificată Item-Based Collaborative Filtering în JavaScript
 * LABORATOR 5: Calculul Top-K Recomandări pentru Premier League Dataset
 */

class SimpleItemBasedCF {
    constructor() {
        this.userItemMatrix = null;
        this.itemSimilarityMatrix = null;
        this.itemNames = null;
    }

    /**
     * Creează o matrice demo pentru demonstrarea conceptelor
     */
    createDemoMatrix() {
        // Matrice User-Item simplificată
        // Rânduri = Utilizatori, Coloane = Jucători
        // Valorile: 0 = nu a fost ales, 1 = a fost ales
        this.userItemMatrix = [
            [1, 1, 0, 0, 1, 0],  // User 0: alege jucătorii 0, 1, 4
            [1, 0, 1, 0, 0, 1],  // User 1: alege jucătorii 0, 2, 5
            [0, 1, 1, 1, 0, 0],  // User 2: alege jucătorii 1, 2, 3
            [0, 0, 1, 1, 1, 1],  // User 3: alege jucătorii 2, 3, 4, 5
        ];

        // Numele jucătorilor pentru demonstrație
        this.itemNames = [
            "Haaland (Man City, FW)",
            "Salah (Liverpool, FW)", 
            "Rice (Arsenal, MF)",
            "van Dijk (Liverpool, DF)",
            "De Bruyne (Man City, MF)",
            "Saka (Arsenal, FW)"
        ];

        console.log("Demo User-Item Matrix:");
        const playerShortNames = this.itemNames.map(name => name.split()[0]);
        console.log("Users\\Players:", playerShortNames);
        
        this.userItemMatrix.forEach((row, index) => {
            console.log(`User ${index}:        [${row.join(', ')}]`);
        });

        return this.userItemMatrix;
    }

    /**
     * Calculează matricea de similaritate item-item
     */
    computeItemSimilarity() {
        // Transpune matricea pentru a avea item-urile pe rânduri
        const itemUserMatrix = this._transposeMatrix(this.userItemMatrix);
        
        // Calculează cosine similarity
        this.itemSimilarityMatrix = this._computeCosineSimilarityMatrix(itemUserMatrix);

        console.log(`\nItem-Item Similarity Matrix (${this.itemNames.length}x${this.itemNames.length}):`);
        const playerShortNames = this.itemNames.map(name => name.split('(')[0].trim());
        console.log("Items:", playerShortNames);
        
        this.itemSimilarityMatrix.forEach((row, index) => {
            const playerName = playerShortNames[index].padEnd(8);
            const formattedRow = row.map(val => val.toFixed(2));
            console.log(`${playerName}: [${formattedRow.join(', ')}]`);
        });

        return this.itemSimilarityMatrix;
    }

    /**
     * Calculează Top-K recomandări pentru un utilizator
     */
    getTopKRecommendations(userId, k = 3) {
        console.log(`\nTOP-${k} RECOMMENDATIONS FOR USER ${userId}:`);
        console.log("=".repeat(50));

        const userRatings = this.userItemMatrix[userId];
        const likedIndices = userRatings.map((rating, index) => rating === 1 ? index : -1)
                                       .filter(index => index !== -1);
        const likedPlayers = likedIndices.map(index => this.itemNames[index].split('(')[0].trim());
        
        console.log(`User ${userId} current choices: [${likedIndices.join(', ')}]`);
        console.log(`User ${userId} liked players: [${likedPlayers.join(', ')}]`);

        const numItems = userRatings.length;
        const predictedScores = new Array(numItems).fill(0);

        // Pentru fiecare jucător pe care utilizatorul nu l-a ales încă
        for (let itemIdx = 0; itemIdx < numItems; itemIdx++) {
            if (userRatings[itemIdx] === 1) {  // Deja ales
                predictedScores[itemIdx] = -1;  // Exclude din recomandări
                continue;
            }

            // Găsește jucătorii similari pe care utilizatorul i-a ales
            let numerator = 0;
            let denominator = 0;

            likedIndices.forEach(likedItemIdx => {
                const similarity = this.itemSimilarityMatrix[itemIdx][likedItemIdx];
                numerator += similarity * userRatings[likedItemIdx];  // În acest caz rating = 1
                denominator += Math.abs(similarity);
            });

            if (denominator > 0) {
                predictedScores[itemIdx] = numerator / denominator;
            }

            const playerName = this.itemNames[itemIdx].split('(')[0].trim();
            const similarities = likedIndices.map(j => this.itemSimilarityMatrix[itemIdx][j].toFixed(3));
            
            console.log(`\nPlayer ${itemIdx} (${playerName}):`);
            console.log(`  Similarities with liked players: [${similarities.join(', ')}]`);
            console.log(`  Predicted score: ${predictedScores[itemIdx].toFixed(3)}`);
        }

        // Găsește Top-K items
        const eligibleItems = predictedScores
            .map((score, index) => ({ index, score }))
            .filter(item => item.score >= 0);

        if (eligibleItems.length === 0) {
            console.log("\nNo recommendations found!");
            return [];
        }

        const topKItems = eligibleItems
            .sort((a, b) => b.score - a.score)
            .slice(0, k);

        console.log(`\nTOP-${k} RECOMMENDATIONS:`);
        const recommendations = topKItems.map((item, rank) => {
            const playerInfo = this.itemNames[item.index];
            const score = item.score;
            console.log(`${rank + 1}. ${playerInfo} - Score: ${score.toFixed(3)}`);
            return {
                rank: rank + 1,
                player: playerInfo,
                score: score
            };
        });

        return recommendations;
    }

    /**
     * Utilitare pentru transpusa matricei
     */
    _transposeMatrix(matrix) {
        return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    }

    /**
     * Calculează matricea de cosine similarity
     */
    _computeCosineSimilarityMatrix(matrix) {
        const numItems = matrix.length;
        const similarityMatrix = Array(numItems).fill().map(() => Array(numItems).fill(0));

        for (let i = 0; i < numItems; i++) {
            for (let j = 0; j < numItems; j++) {
                if (i === j) {
                    similarityMatrix[i][j] = 1.0;
                } else {
                    similarityMatrix[i][j] = this._cosineSimilarity(matrix[i], matrix[j]);
                }
            }
        }

        return similarityMatrix;
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
}

/**
 * Funcția principală pentru demonstrația algoritmului
 */
function demonstrateItemBasedCF() {
    console.log("ITEM-BASED COLLABORATIVE FILTERING DEMONSTRATION");
    console.log("=".repeat(60));
    console.log("Simulăm un sistem de recomandări pentru Fantasy Football");
    console.log("Users aleg jucători, algoritmul recomandă alți jucători similari\n");

    // Inițializează sistemul
    const cfSystem = new SimpleItemBasedCF();

    // Creează matricea demo
    cfSystem.createDemoMatrix();

    // Calculează similaritățile
    cfSystem.computeItemSimilarity();

    // Analizează similaritățile
    console.log(`\nSIMILARITY ANALYSIS:`);
    console.log("Haaland este similar cu:");
    const haalandSimilarities = cfSystem.itemSimilarityMatrix[0];  // Haaland este item 0
    haalandSimilarities.forEach((sim, index) => {
        if (index !== 0 && sim > 0.1) {  // Exclude pe Haaland însuși
            console.log(`  - ${cfSystem.itemNames[index]}: ${sim.toFixed(3)}`);
        }
    });

    // Generează recomandări pentru fiecare utilizator
    for (let userId = 0; userId < cfSystem.userItemMatrix.length; userId++) {
        cfSystem.getTopKRecommendations(userId, 2);
    }

    console.log(`\nDemonstrația Item-Based CF completă!`);
}

/**
 * Test cu implementarea completă
 */
async function testWithRealData() {
    console.log("\n" + "=".repeat(60));
    console.log("TESTING WITH REAL PREMIER LEAGUE DATA");
    console.log("=".repeat(60));

    try {
        // Încearcă să importe implementarea completă
        const ItemBasedCollaborativeFiltering = require('./ItemBasedCollaborativeFiltering');

        // Inițializează sistemul complet
        const cfSystem = new ItemBasedCollaborativeFiltering();

        // Încarcă datele reale
        const dataLoaded = await cfSystem.loadPremierLeagueData();
        if (dataLoaded) {
            // Creează interacțiuni pentru demo
            cfSystem.createSyntheticUserInteractions(10, 8);

            // Calculează similaritățile
            cfSystem.computeItemSimilarityMatrix();

            console.log(`\nREAL DATA RECOMMENDATIONS (User 0):`);
            const recommendations = cfSystem.getTopKRecommendations(0, 5);

            recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec.player_name} (${rec.team}, ${rec.position}) - Score: ${rec.predicted_score.toFixed(3)}`);
            });

            console.log(`\nReal data test completed successfully!`);
        } else {
            console.log("Could not load Premier League data");
        }

    } catch (error) {
        console.log("Could not import full implementation. Make sure all dependencies are installed.");
        console.log(`Error: ${error.message}`);
    }
}

// Export pentru utilizare ca modul
module.exports = SimpleItemBasedCF;

// Rulează demonstrația dacă fișierul este executat direct
if (require.main === module) {
    (async () => {
        // Demonstrația principală
        demonstrateItemBasedCF();
        
        // Test cu date reale
        await testWithRealData();
    })();
}