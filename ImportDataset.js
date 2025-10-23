const { ApiClient, requests } = require('recombee-api-client');
const { SetItemValues, Batch } = requests;
const fs = require('fs');
const csv = require('csv-parser');


const client = new ApiClient(
  'gherghe-dev',
  'FxYn3YY7f2zjICFSr54mJjLY23LsPiyL0hBz5SVK1Fg5josfBwOAAIMpds05G7oE'
);

// Path to your CSV file (adjust this path based on your file location)
const csvFilePath = '../PL_players-dataset/fbref_PL_2024-25.csv';

async function importPlayerData() {
  try {
    console.log('Starting dataset import...');
    
    const players = [];
    
    // Read and parse CSV file
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {

          // Based on actual CSV headers: Player, Pos, Squad, Age, Born, MP, Min, Gls, Ast, G+A
          // Note: Gls, Ast, G+A are per 90 minutes, so we calculate totals using 90s column
          const playerId = `player_${players.length + 1}`; // Generate unique ID
          
          const games90 = parseFloat(row['90s']) || 0;
          const glsPer90 = parseFloat(row['Gls']) || 0;
          const astPer90 = parseFloat(row['Ast']) || 0;
          const gaPer90 = parseFloat(row['G+A']) || 0;
          
          const playerData = {
            Player_name: row['Player'] || '',
            Position: row['Pos'] || '',
            Team_name: row['Squad'] || '',
            Age: parseInt(row['Age']) || 0,
            Birth_year: parseInt(row['Born']) || 0,
            Matches_played: parseInt(row['MP']) || 0,
            Minutes_played: parseInt(row['Min']) || 0,
            Total_goals: Math.round(glsPer90 * games90),
            Total_assists: Math.round(astPer90 * games90),
            Goals_plus_assists: Math.round(gaPer90 * games90)
          };
          
          // Create SetItemValues request
          const setItemRequest = new SetItemValues(
            playerId,
            playerData,
            { cascadeCreate: true } // This will create the item if it doesn't exist
          );
          
          players.push(setItemRequest);
          
          // Log progress every 50 players
          if (players.length % 50 === 0) {
            console.log(`Processed ${players.length} players...`);
          }
        })
        .on('end', async () => {
          try {
            console.log(`Total players to import: ${players.length}`);
            
            // Send data in batches (Recombee recommends batches for better performance)
            const batchSize = 100;
            const batches = [];
            
            for (let i = 0; i < players.length; i += batchSize) {
              const batch = players.slice(i, i + batchSize);
              batches.push(new Batch(batch));
            }
            
            console.log(`Sending ${batches.length} batches to Recombee...`);
            
            // Send all batches
            for (let i = 0; i < batches.length; i++) {
              await client.send(batches[i]);
              console.log(`Batch ${i + 1}/${batches.length} sent successfully`);
            }
            
            console.log('All player data imported successfully to Recombee!');
            console.log(`Total players imported: ${players.length}`);
            resolve();
            
          } catch (error) {
            console.error('Error sending data to Recombee:', error);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          reject(error);
        });
    });
    
  } catch (error) {
    console.error('Error importing dataset:', error);
  }
}


importPlayerData();
