const { ApiClient, requests } = require('recombee-api-client');
const { AddItemProperty } = requests;


// valorile din Recombee
const client = new ApiClient(
  'gherghe-dev',     
  'FxYn3YY7f2zjICFSr54mJjLY23LsPiyL0hBz5SVK1Fg5josfBwOAAIMpds05G7oE'
);

async function defineItemProperties() {
  try {
    // string properties (txt)
    await client.send(new AddItemProperty('Player_name', 'string'));
    await client.send(new AddItemProperty('Position', 'string'));
    await client.send(new AddItemProperty('Team_name', 'string'));

    // integer properties
    await client.send(new AddItemProperty('Age', 'int'));
    await client.send(new AddItemProperty('Birth_year', 'int'));
    await client.send(new AddItemProperty('Matches_played', 'int'));
    await client.send(new AddItemProperty('Minutes_played', 'int'));
    await client.send(new AddItemProperty('Total_goals', 'int'));
    await client.send(new AddItemProperty('Total_assists', 'int'));
    await client.send(new AddItemProperty('Goals_plus_assists', 'int'));

    console.log('Properties have been defined successfully in Recombee!');
  } catch (error) {
    console.error('Error defining properties:', error);
  }
}

defineItemProperties();
