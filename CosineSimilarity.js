const fs = require('fs');
const csv = require('csv-parser');

/**
 * Premier League Players Cosine Similarity Calculator
 * Calculează similaritatea între jucători folosind:
 * 1. Text features (Position, Team, Nation)
 * 2. Performance statistics (Goals, Assists, xG, etc.)
 * 3. Demographic features (Age, Minutes played)
 */

class PlayerSimilarityCalculator {
    constructor() {
        this.players = [];
        this.textFeatures = ['Pos', 'Squad', 'Nation'];
        this.numericFeatures = ['Age', 'Gls', 'Ast', 'G+A', 'xG', 'xAG', 'MP', 'Min'];
    }

    // Încarcă și procesează dataset-ul
    async loadDataset(csvPath) {
        return new Promise((resolve, reject) => {
            const players = [];
            const seen = new Set(); // Pentru a elimina duplicatele
            
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    // Creează o cheie unică pentru fiecare jucător
                    const uniqueKey = `${row.Player}_${row.Squad}_${row.Pos}_${row.Age}`;
                    
                    // Skip dacă am văzut deja acest jucător
                    if (seen.has(uniqueKey)) {
                        return;
                    }
                    seen.add(uniqueKey);
                    
                    // Normalizează și curăță datele
                    const player = {
                        id: `player_${row.Rk}`,
                        name: row.Player,
                        position: this.normalizeText(row.Pos),
                        team: this.normalizeText(row.Squad),
                        nation: this.normalizeText(row.Nation),
                        age: parseInt(row.Age) || 0,
                        goals: parseFloat(row.Gls) || 0,
                        assists: parseFloat(row.Ast) || 0,
                        goals_assists: parseFloat(row['G+A']) || 0,
                        xg: parseFloat(row.xG) || 0,
                        xag: parseFloat(row.xAG) || 0,
                        matches: parseInt(row.MP) || 0,
                        minutes: parseInt(row.Min) || 0,
                        // Calculează rate-uri per 90 minute
                        goals_per_90: this.calculatePer90(row.Gls, row['90s']),
                        assists_per_90: this.calculatePer90(row.Ast, row['90s'])
                    };
                    
                    players.push(player);
                })
                .on('end', () => {
                    this.players = players.filter(p => p.name && p.team);
                    console.log(`Loaded ${this.players.length} unique players successfully`);
                    console.log(`Eliminated ${1148 - this.players.length} duplicates`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    // Normalizează textul pentru consistență
    normalizeText(text) {
        if (!text) return '';
        return text.toString().trim().toLowerCase().replace(/\s+/g, ' ');
    }

    // Calculează statistici per 90 minute
    calculatePer90(value, games90) {
        const val = parseFloat(value) || 0;
        const g90 = parseFloat(games90) || 0;
        return g90 > 0 ? val / g90 : 0;
    }

    // Creează vectorul de text features folosind TF-IDF simplificat
    createTextVector(player) {
        const textCombined = `${player.position} ${player.team} ${player.nation}`;
        const words = textCombined.split(' ').filter(word => word.length > 2);
        
        // Creează un vector de cuvinte unice din toate jucătorii
        const vocabulary = this.getVocabulary();
        const vector = new Array(vocabulary.length).fill(0);
        
        words.forEach(word => {
            const index = vocabulary.indexOf(word);
            if (index !== -1) {
                vector[index] += 1; // TF simplu
            }
        });
        
        return vector;
    }

    // Obține vocabularul complet din dataset
    getVocabulary() {
        if (this.vocabulary) return this.vocabulary;
        
        const allWords = new Set();
        this.players.forEach(player => {
            const text = `${player.position} ${player.team} ${player.nation}`;
            text.split(' ').forEach(word => {
                if (word.length > 2) allWords.add(word);
            });
        });
        
        this.vocabulary = Array.from(allWords).sort();
        return this.vocabulary;
    }

    // Creează vectorul de features numerice normalizat
    createNumericVector(player) {
        return [
            this.normalize(player.age, 16, 40),
            this.normalize(player.goals_per_90, 0, 2),
            this.normalize(player.assists_per_90, 0, 1),
            this.normalize(player.xg, 0, 20),
            this.normalize(player.xag, 0, 15),
            this.normalize(player.matches, 0, 38),
            this.normalize(player.minutes, 0, 3500)
        ];
    }

    // Normalizare min-max
    normalize(value, min, max) {
        return max > min ? (value - min) / (max - min) : 0;
    }

    // Calculează cosine similarity între doi vectori
    cosineSimilarity(vectorA, vectorB) {
        if (vectorA.length !== vectorB.length) {
            throw new Error('Vectors must have same length');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += vectorA[i] * vectorA[i];
            normB += vectorB[i] * vectorB[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (normA * normB);
    }

    // Calculează similaritatea combinată (text + numeric)
    calculatePlayerSimilarity(player1, player2, textWeight = 0.4, numericWeight = 0.6) {
        // Similaritatea pe bază de text
        const textVector1 = this.createTextVector(player1);
        const textVector2 = this.createTextVector(player2);
        const textSimilarity = this.cosineSimilarity(textVector1, textVector2);

        // Similaritatea pe bază de statistici numerice
        const numericVector1 = this.createNumericVector(player1);
        const numericVector2 = this.createNumericVector(player2);
        const numericSimilarity = this.cosineSimilarity(numericVector1, numericVector2);

        // Combinăm cu pondere
        return (textSimilarity * textWeight) + (numericSimilarity * numericWeight);
    }

    // Găsește jucătorii cei mai similari pentru un jucător dat
    findSimilarPlayers(targetPlayerName, topK = 5) {
        const targetPlayer = this.players.find(p => 
            p.name.toLowerCase().includes(targetPlayerName.toLowerCase())
        );

        if (!targetPlayer) {
            console.log(`Player "${targetPlayerName}" not found`);
            return [];
        }

        console.log(`Finding similar players to: ${targetPlayer.name} (${targetPlayer.team}, ${targetPlayer.position})`);

        const similarities = this.players
            .filter(p => p.id !== targetPlayer.id)
            .map(player => ({
                player: player,
                similarity: this.calculatePlayerSimilarity(targetPlayer, player),
                textSim: this.cosineSimilarity(
                    this.createTextVector(targetPlayer), 
                    this.createTextVector(player)
                ),
                numericSim: this.cosineSimilarity(
                    this.createNumericVector(targetPlayer), 
                    this.createNumericVector(player)
                )
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);

        return similarities;
    }

    // Afișează rezultatele într-un format frumos
    displaySimilarPlayers(results) {
        console.log('\n=== MOST SIMILAR PLAYERS ===');
        console.log('Rank | Name | Team | Position | Combined | Text | Numeric');
        console.log('-----|------|------|----------|----------|------|--------');
        
        results.forEach((result, index) => {
            const p = result.player;
            console.log(
                `${(index + 1).toString().padEnd(4)} | ` +
                `${p.name.padEnd(20)} | ` +
                `${p.team.padEnd(15)} | ` +
                `${p.position.padEnd(8)} | ` +
                `${result.similarity.toFixed(3).padStart(8)} | ` +
                `${result.textSim.toFixed(3).padStart(4)} | ` +
                `${result.numericSim.toFixed(3).padStart(7)}`
            );
        });
    }

    // Analizează distribuția similarității în dataset
    analyzeDataset() {
        console.log('\n=== DATASET ANALYSIS ===');
        console.log(`Total players: ${this.players.length}`);
        
        const positions = [...new Set(this.players.map(p => p.position))];
        const teams = [...new Set(this.players.map(p => p.team))];
        const nations = [...new Set(this.players.map(p => p.nation))];
        
        console.log(`Unique positions: ${positions.length}`);
        console.log(`Unique teams: ${teams.length}`);
        console.log(`Unique nations: ${nations.length}`);
        console.log(`Vocabulary size: ${this.getVocabulary().length} words`);
    }

    // Salvează matrice de similaritate pentru top jucători
    async generateSimilarityMatrix(topPlayers = 20) {
        console.log('\n=== GENERATING SIMILARITY MATRIX ===');
        
        // Selectează top jucătorii după minute jucate (acum fără duplicate)
        const selectedPlayers = this.players
            .sort((a, b) => b.minutes - a.minutes)
            .slice(0, topPlayers);

        const matrix = [];
        const header = ['Player', ...selectedPlayers.map(p => p.name.substring(0, 10))];
        matrix.push(header);

        selectedPlayers.forEach(player1 => {
            const row = [player1.name];
            selectedPlayers.forEach(player2 => {
                if (player1.id === player2.id) {
                    row.push('1.000');
                } else {
                    const sim = this.calculatePlayerSimilarity(player1, player2);
                    row.push(sim.toFixed(3));
                }
            });
            matrix.push(row);
        });

        // Salvează în CSV
        const csvContent = matrix.map(row => row.join(',')).join('\n');
        fs.writeFileSync('similarity_matrix.csv', csvContent);
        console.log(`Similarity matrix saved to similarity_matrix.csv (${topPlayers}x${topPlayers})`);
    }
}

// Funcție principală de rulare
async function main() {
    try {
        const calculator = new PlayerSimilarityCalculator();
        
        // Încarcă dataset-ul
        await calculator.loadDataset('fbref_PL_2024-25.csv');
        
        // Analizează dataset-ul
        calculator.analyzeDataset();
        
        // Testează cu câțiva jucători cunoscuți
        const testPlayers = ['Haaland', 'Salah', 'Bruno Fernandes', 'Saka'];
        
        for (const playerName of testPlayers) {
            console.log(`\n${'='.repeat(60)}`);
            const results = calculator.findSimilarPlayers(playerName, 5);
            if (results.length > 0) {
                calculator.displaySimilarPlayers(results);
            }
        }
        
        // Generează matrice de similaritate
        await calculator.generateSimilarityMatrix(15);
        
        console.log('\n✅ Cosine similarity analysis completed!');
        
    } catch (error) {
        console.error('Error in similarity calculation:', error);
    }
}

// Rulează scriptul
if (require.main === module) {
    main();
}

module.exports = PlayerSimilarityCalculator;