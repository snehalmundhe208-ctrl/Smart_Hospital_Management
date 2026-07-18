const db = require('./src/config/DatabaseConfig');
const jwt = require('jsonwebtoken');

async function run() {
  try {
    const res = await db.query("SELECT d.id as doctor_id, d.user_id FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'doctor1@hospital.com'");
    const doc = res.rows[0];
    const token = jwt.sign({ id: doc.user_id, role: 'DOCTOR' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    
    const response = await fetch('http://localhost:5000/api/appointments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.length > 0) {
      console.log('Keys of the appointment object:');
      console.log(Object.keys(data[0]));
      console.log('\nValues:');
      console.log(data[0]);
    } else {
      console.log('No appointments found for doctor1');
    }
  } catch(e) {
    console.error('Failed:', e);
  }
}
run();
