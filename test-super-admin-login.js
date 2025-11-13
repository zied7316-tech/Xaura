// Test Super Admin Login
const fetch = require('node-fetch');

const testLogin = async () => {
  try {
    console.log('🧪 Testing Super Admin Login...\n');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@xaura.com',
        password: 'SuperAdmin123!'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ LOGIN SUCCESSFUL!\n');
      console.log('👤 User Info:');
      console.log('   Name:', data.user.name);
      console.log('   Email:', data.user.email);
      console.log('   Role:', data.user.role);
      console.log('\n🔑 Token:', data.token.substring(0, 20) + '...');
      console.log('\n✅ Super Admin login is working at the API level!');
      console.log('📝 If the dashboard won\'t open, it\'s a frontend routing issue.\n');
    } else {
      console.log('❌ LOGIN FAILED!');
      console.log('Error:', data.message);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('Is the backend server running on port 5000?');
  }
};

testLogin();




