const { ApiClient, requests } = require('recombee-api-client');
const { AddUserProperty } = requests;

// Recombee client configuration
const client = new ApiClient(
  'gherghe-dev',     
  'FxYn3YY7f2zjICFSr54mJjLY23LsPiyL0hBz5SVK1Fg5josfBwOAAIMpds05G7oE'
);

async function defineUserProperties() {
  try {
    console.log('Starting user properties definition...');
    
    // Define string properties for users
    await client.send(new AddUserProperty('first_name', 'string'));
    console.log('Added property: first_name (string)');
    
    await client.send(new AddUserProperty('last_name', 'string'));
    console.log('Added property: last_name (string)');
    
    await client.send(new AddUserProperty('email', 'string'));
    console.log('Added property: email (string)');
    
    await client.send(new AddUserProperty('team_preference', 'string'));
    console.log('Added property: team_preference (string)');
    
    await client.send(new AddUserProperty('location', 'string'));
    console.log('Added property: location (string)');
    
    // Define integer properties for users
    await client.send(new AddUserProperty('age', 'int'));
    console.log('Added property: age (int)');
    
    await client.send(new AddUserProperty('years_watching_football', 'int'));
    console.log('Added property: years_watching_football (int)');
    
    // Define boolean property for premium status
    await client.send(new AddUserProperty('is_premium', 'boolean'));
    console.log('Added property: is_premium (boolean)');
    
    console.log('All user properties defined successfully in Recombee!');
    
  } catch (error) {
    console.error('Error defining user properties:', error);
  }
}

// Run the function
defineUserProperties();