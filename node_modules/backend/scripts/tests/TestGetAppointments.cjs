const jwt = require('jsonwebtoken');

async function run() {
  try {
    const token = jwt.sign({ id: '2359caa8-6be6-4f24-81f9-22594c724b5a', role: 'DOCTOR' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    
    const response = await fetch('http://localhost:5000/api/appointments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    console.log(data[0]);
  } catch(e) {
    console.error('Failed:', e);
  }
}
run();