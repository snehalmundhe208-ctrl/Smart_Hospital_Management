const db = require('./src/config/DatabaseConfig');
const jwt = require('jsonwebtoken');

async function run() {
  try {
    const res = await db.query("SELECT d.id as doctor_id, d.user_id FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'doctor1@hospital.com'");
    const doc = res.rows[0];
    const token = jwt.sign({ id: doc.user_id, role: 'DOCTOR' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    
    console.log('Doctor token generated');
    
    // find an appt
    const apptRes = await db.query("SELECT * FROM appointments WHERE doctor_id = $1 LIMIT 1", [doc.doctor_id]);
    const appt = apptRes.rows[0];
    
    const reqBody = {
      appointment_id: appt.id,
      patient_id: appt.patient_id,
      diagnosis: 'Test Diagnosis',
      notes: 'Test Notes',
      medical_findings: 'Test Findings',
      conclusion: 'Test Conclusion',
      follow_up_date: '',
      items: [{ medicine_name: 'Paracetamol', dosage: '500mg' }]
    };
    
    const response = await fetch('http://localhost:5000/api/prescriptions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(reqBody)
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Data:', data);
  } catch(e) {
    console.error('Failed:', e);
  }
}
run();

