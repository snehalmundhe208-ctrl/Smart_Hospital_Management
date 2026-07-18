const axios = require('axios');
async function login() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'patient1@example.com',
      password: 'Password123!'
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Failed:", err.response ? err.response.data : err.message);
  }
}
login();
