const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'patient1@example.com',
      password: 'Password123!'
    });
    const token = res.data.token;
    const meRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Me success:", meRes.data);
  } catch (err) {
    console.error("Failed:", err.response ? err.response.data : err.message);
  }
}
test();
