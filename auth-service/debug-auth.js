require('dotenv').config({ path: '../.env' });
const axios = require('axios');

const NAVIDROME_URL = process.env.NAVIDROME_URL || 'http://localhost:4533';
const ADMIN_USER = process.env.NAVIDROME_ADMIN_USER;
const ADMIN_PASSWORD = process.env.NAVIDROME_ADMIN_PASSWORD;

console.log('--- Navidrome Auth Debugger ---');
console.log(`URL: ${NAVIDROME_URL}`);
console.log(`User: ${ADMIN_USER}`);
console.log(`Pass: ${ADMIN_PASSWORD ? '***' + ADMIN_PASSWORD.slice(-2) : 'MISSING'}`);
console.log(`Pass Length: ${ADMIN_PASSWORD ? ADMIN_PASSWORD.length : 0}`);

async function testAuth() {
  try {
    console.log('Attempting login...');
    const response = await axios.post(`${NAVIDROME_URL}/auth/login`, {
      username: ADMIN_USER,
      password: ADMIN_PASSWORD
    });
    console.log('✅ Success! Token received.');
    console.log('Token starts with:', response.data.token.slice(0, 10));
  } catch (error) {
    console.error('❌ Failed!');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:',JSON.stringify(error.response.data));
      console.error('Headers:', JSON.stringify(error.response.headers));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAuth();
