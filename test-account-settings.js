// Test Account Settings Endpoints
const BASE_URL = 'https://jigarthanda-api.onrender.com';

// Test Data
const testUserId = 'usr_nazir_001';
const testNewUsername = 'testuser_' + Date.now();
const testCurrentPassword = 'admin123';
const testNewPassword = 'newpassword123';

console.log('🧪 Testing Account Settings Endpoints...\n');

// Test 1: Update Username
console.log('1️⃣ Testing Username Update...');
console.log('User ID:', testUserId);
console.log('New Username:', testNewUsername);

fetch(`${BASE_URL}/api/update-username`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: testUserId,
    newUsername: testNewUsername,
  }),
})
.then(response => {
  console.log('Status:', response.status);
  return response.text();
})
.then(text => {
  console.log('Raw Response:', text);
  try {
    const json = JSON.parse(text);
    console.log('✅ Username Update Result:', json);
  } catch(e) {
    console.log('❌ JSON Parse Error:', e.message);
  }
})
.catch(error => {
  console.error('❌ Username Update Error:', error);
})
.then(() => {
  console.log('\n2️⃣ Testing Password Update...');
  console.log('User ID:', testUserId);
  console.log('Current Password:', testCurrentPassword);
  console.log('New Password:', testNewPassword);

  // Test 2: Update Password
  return fetch(`${BASE_URL}/api/update-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: testUserId,
      currentPassword: testCurrentPassword,
      newPassword: testNewPassword,
    }),
  });
})
.then(response => {
  console.log('Status:', response.status);
  return response.text();
})
.then(text => {
  console.log('Raw Response:', text);
  try {
    const json = JSON.parse(text);
    console.log('✅ Password Update Result:', json);
  } catch(e) {
    console.log('❌ JSON Parse Error:', e.message);
  }
})
.catch(error => {
  console.error('❌ Password Update Error:', error);
})
.then(() => {
  console.log('\n🎯 Test Complete!');
  console.log('If you see success messages above, account settings are working!');
  console.log('If you see errors, check server logs and fix syntax issues.');
});
