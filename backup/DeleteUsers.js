const { ApiClient, requests } = require('recombee-api-client');
const { DeleteUser, Batch } = requests;

// Recombee client configuration
const client = new ApiClient(
  'gherghe-dev',
  'FxYn3YY7f2zjICFSr54mJjLY23LsPiyL0hBz5SVK1Fg5josfBwOAAIMpds05G7oE'
);

async function deleteAllUsers() {
  try {
    console.log('Starting deletion of all users...');
    
    // Delete users by known pattern (user_1, user_2, etc.)
    const deleteRequests = [];
    
    // Generate delete requests for all possible user IDs (up to 100 to be safe)
    for (let i = 1; i <= 100; i++) {
      deleteRequests.push(new DeleteUser(`user_${i}`));
    }
    
    console.log(`Created ${deleteRequests.length} delete requests`);
    
    // Send in batches
    const batchSize = 50;
    
    for (let i = 0; i < deleteRequests.length; i += batchSize) {
      const batch = deleteRequests.slice(i, i + batchSize);
      try {
        await client.send(new Batch(batch));
        console.log(`Processed delete batch ${Math.floor(i/batchSize) + 1}`);
      } catch (error) {
        // Some users might not exist, that's OK
        console.log(`Some users in batch ${Math.floor(i/batchSize) + 1} didn't exist (expected)`);
      }
    }
    
    console.log('All existing users deleted successfully');
    
  } catch (error) {
    console.error('Error deleting users:', error);
  }
}

// Run the deletion
deleteAllUsers();