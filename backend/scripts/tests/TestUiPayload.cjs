const jwt = require('jsonwebtoken');

async function run() {
  try {
    const { Client } = require('pg');
    require('dotenv').config({ path: '.env' });
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const dRes = await client.query("SELECT id, user_id FROM doctors LIMIT 1");
    if (dRes.rows.length === 0) return console.log('No doctor');
    const doctor = dRes.rows[0];

    const patRes = await client.query("SELECT id FROM patients LIMIT 1");
    const pId = patRes.rows[0].id;

    // Create appointment
    const aRes = await client.query(`
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, status)
      VALUES ($1, $2, CURRENT_DATE, '10:00:00', 'WALK_IN', 'IN_CONSULTATION') RETURNING id
    `, [pId, doctor.id]);
    const apptId = aRes.rows[0].id;

    const token = jwt.sign({ id: doctor.user_id, role: 'DOCTOR' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    console.log('Sending exact UI payload...');
    const payload = {
        appointment_id: apptId,
        patient_id: pId,
        diagnosis: 'Test Diagnosis',
        follow_up_date: '',
        medical_findings: '',
        conclusion: '',
        notes: '',
        items: []
    };

    const res = await fetch('http://localhost:5000/api/prescriptions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', data);

    // Test PUT status
    console.log('\nSending PUT status...');
    const putRes = await fetch(`http://localhost:5000/api/appointments/${apptId}/status`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    const putData = await putRes.text();
    console.log('PUT Status:', putRes.status);
    console.log('PUT Response:', putData);

    await client.end();
  } catch(e) {
    console.error('Failed:', e);
  }
}
run();
