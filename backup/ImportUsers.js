const { ApiClient, requests } = require('recombee-api-client');
const { SetUserValues, Batch } = requests;
const fs = require('fs');
const csv = require('csv-parser');

// Recombee client configuration
const client = new ApiClient(
  'gherghe-dev',
  'FxYn3YY7f2zjICFSr54mJjLY23LsPiyL0hBz5SVK1Fg5josfBwOAAIMpds05G7oE'
);

// ONLY Premier League teams - no exceptions
const PREMIER_LEAGUE_TEAMS = [
  'Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United',
  'Tottenham', 'Newcastle United', 'Aston Villa', 'Brighton', 'West Ham',
  'Everton', 'Brentford', 'Crystal Palace', 'Fulham', 'Wolves',
  'Bournemouth', 'Nottingham Forest', 'Leicester City', 'Ipswich Town', 'Southampton'
];

const FIRST_NAMES = [
  'James', 'Robert', 'John', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher',
  'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Lisa', 'Nancy', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

const UK_LOCATIONS = [
  'London', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds', 'Newcastle',
  'Brighton', 'Southampton', 'Leicester', 'Wolverhampton', 'Bristol'
];

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomAge() {
  return Math.floor(Math.random() * 50) + 18; // 18-67
}

function generateWatchingYears(age) {
  return Math.floor(Math.random() * (age - 12)) + 3; // Started watching between age 3 and current age
}

function generateEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${getRandomElement(domains)}`;
}

async function step2_ImportCleanUsers() {
  try {
    console.log('Step 2: Importing users with ONLY Premier League teams...');
    
    const users = [];
    let userIndex = 1;

    // Read people.csv for base names
    return new Promise((resolve, reject) => {
      fs.createReadStream('people.csv')
        .pipe(csv())
        .on('data', (row) => {
          const fullName = row['Sales person'] || '';
          const nameParts = fullName.trim().split(' ');
          
          let firstName, lastName;
          if (nameParts.length >= 2 && nameParts[0] && nameParts[1]) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          } else {
            firstName = getRandomElement(FIRST_NAMES);
            lastName = getRandomElement(LAST_NAMES);
          }
          
          const age = generateRandomAge();
          const userData = {
            first_name: firstName,
            last_name: lastName,
            email: generateEmail(firstName, lastName),
            team_preference: getRandomElement(PREMIER_LEAGUE_TEAMS), // ALWAYS Premier League
            location: row['Location'] && row['Location'].trim() ? row['Location'] : getRandomElement(UK_LOCATIONS),
            age: age,
            years_watching_football: generateWatchingYears(age),
            is_premium: Math.random() > 0.7
          };

          const userId = `user_${userIndex}`;
          users.push(new SetUserValues(userId, userData, { cascadeCreate: true }));
          userIndex++;
          
          if (users.length % 10 === 0) {
            console.log(`Processed ${users.length} users from CSV...`);
          }
        })
        .on('end', async () => {
          // Add additional random users
          const csvCount = users.length;
          console.log(`CSV users: ${csvCount}`);
          
          const additionalUsersCount = 20; // Add 20 more random users
          for (let i = 0; i < additionalUsersCount; i++) {
            const firstName = getRandomElement(FIRST_NAMES);
            const lastName = getRandomElement(LAST_NAMES);
            const age = generateRandomAge();
            
            const userData = {
              first_name: firstName,
              last_name: lastName,
              email: generateEmail(firstName, lastName),
              team_preference: getRandomElement(PREMIER_LEAGUE_TEAMS), // ALWAYS Premier League
              location: getRandomElement(UK_LOCATIONS),
              age: age,
              years_watching_football: generateWatchingYears(age),
              is_premium: Math.random() > 0.6
            };

            const userId = `user_${userIndex}`;
            users.push(new SetUserValues(userId, userData, { cascadeCreate: true }));
            userIndex++;
          }
          
          console.log(`Total users to import: ${users.length}`);
          
          // Send in batches
          const batchSize = 50;
          const batches = [];
          
          for (let i = 0; i < users.length; i += batchSize) {
            batches.push(new Batch(users.slice(i, i + batchSize)));
          }
          
          console.log(`Sending ${batches.length} batches...`);
          
          for (let i = 0; i < batches.length; i++) {
            await client.send(batches[i]);
            console.log(`Batch ${i + 1}/${batches.length} imported successfully`);
          }
          
          console.log('Step 2 complete: All users imported with Premier League teams');
          console.log(`Total users imported: ${users.length}`);
          resolve();
        })
        .on('error', reject);
    });
    
  } catch (error) {
    console.error('Error in Step 2:', error);
  }
}

// Run the import
step2_ImportCleanUsers();