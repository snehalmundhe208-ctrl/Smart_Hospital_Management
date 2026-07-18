const axios = require('axios');
async function run() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', { email: 'doctor1@hospital.com', password: 'password123' });
    const token = res.data.token;
    console.log('Logged in as doctor');
    
    // get appointments to find one
    const appts = await axios.get('http://localhost:5000/api/appointments', { headers: { Authorization: `Bearer ${token}` } });
    const appt = appts.data.find(a => a.status !== 'COMPLETED');
    
    if(!appt) { console.log('no appt'); return; }
    
    console.log('Trying to generate report for appt:', appt.id, 'patient_id:', appt.patient_id);

    // try to create prescription
    const pRes = await axios.post('http://localhost:5000/api/prescriptions', {
      appointment_id: appt.id,
      patient_id: appt.patient_id,
      diagnosis: 'Test Diagnosis',
      notes: 'Test Notes',
      medical_findings: 'Test Findings',
      conclusion: 'Test Conclusion',
      follow_up_date: '2026-10-10',
      items: [{ medicine_name: 'Paracetamol', dosage: '500mg' }]
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Success:', pRes.data);
  } catch(e) {
    console.error('Failed:', e.response?.data || e.message);
  }
}
run();
