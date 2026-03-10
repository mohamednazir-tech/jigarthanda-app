// Create users in production database
const BASE_URL = 'https://jigarthanda-api.onrender.com';

// Users from mocks/users.ts (CORRECT USERS)
const users = [
  {
    userId: 'usr_admin_001',
    username: 'admin',
    password: 'admin123',
    role: 'staff'
  },
  {
    userId: 'usr_nazir_001', 
    username: 'baseel',
    password: 'baseel123',
    role: 'admin'
  }
];

console.log('🔧 Creating users in production database...');

async function createUsers() {
  for (const user of users) {
    try {
      const response = await fetch(`${BASE_URL}/api/create-test-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ User created: ${user.username} (${user.id})`);
      } else {
        console.log(`❌ Failed to create ${user.username}: ${result.message}`);
      }
    } catch (error) {
      console.log(`❌ Error creating ${user.username}:`, error.message);
    }
  }
  
  console.log('\n🎯 Users creation complete!');
  console.log('Now you can test password updates with:');
  console.log('- admin / admin123');
  console.log('- baseel / baseel123');
}

createUsers();
