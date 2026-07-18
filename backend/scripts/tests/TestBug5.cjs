const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:5000/api';
// Simulate auth
function generateToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
}

async function fetchAPI(path, method = 'GET', body = null, token) {
  const options = {
     method,
     headers: { 'Authorization': `Bearer ${token}` }
  };
  if (body) {
     options.headers['Content-Type'] = 'application/json';
     options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
     const errorBody = await res.text();
     const err = new Error(`HTTP ${res.status}: ${errorBody}`);
     err.status = res.status;
     throw err;
  }
  return res.json();
}

async function runTests() {
  console.log('Starting API Tests for Bug 5...');
  const { Client } = require('pg');
  require('dotenv').config({ path: '.env' });
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Test 1: Seed data
  console.log('\n--- Test 1: Checking schema ---');
  const constraintRes = await client.query("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'appointments_status_check'");
  console.log('Constraint:', constraintRes.rows[0].pg_get_constraintdef);

  const recRes = await client.query("SELECT id FROM users WHERE role='RECEPTIONIST' LIMIT 1");
  const docRes = await client.query("SELECT id FROM users WHERE role='DOCTOR' LIMIT 1");
  const patRes = await client.query("SELECT id FROM users WHERE role='PATIENT' LIMIT 1");

  const recToken = generateToken(recRes.rows[0].id, 'RECEPTIONIST');
  const docToken = generateToken(docRes.rows[0].id, 'DOCTOR');
  const patToken = generateToken(patRes.rows[0].id, 'PATIENT');

  // Reception fetches appointments
  const recApts = await fetchAPI('/appointments', 'GET', null, recToken);
  const pendingCount = recApts.filter(a => a.status === 'PENDING').length;
  const confirmedCount = recApts.filter(a => a.status === 'CONFIRMED').length;
  const checkedInCount = recApts.filter(a => a.status === 'CHECKED_IN').length;
  const inConsultCount = recApts.filter(a => a.status === 'IN_CONSULTATION').length;
  const completedCount = recApts.filter(a => a.status === 'COMPLETED').length;

  console.log(`\n--- Test 2: Reception Data ---`);
  console.log(`PENDING: ${pendingCount}, CONFIRMED: ${confirmedCount}, CHECKED_IN: ${checkedInCount}, IN_CONSULT: ${inConsultCount}, COMPLETED: ${completedCount}`);

  // Doctor fetches appointments
  const docApts = await fetchAPI('/appointments', 'GET', null, docToken);
  const docPendingCount = docApts.filter(a => a.status === 'PENDING').length;
  console.log(`\n--- Test 3: Doctor Pending Visibility ---`);
  console.log(`Doctor PENDING appointments: ${docPendingCount} (Should be 0)`);

  // Patient booking
  const pRecord = await client.query("SELECT id FROM patients WHERE user_id=$1", [patRes.rows[0].id]);
  const docRecord = await client.query("SELECT id FROM doctors WHERE user_id=$1", [docRes.rows[0].id]);
  
  const rndTime = `${Math.floor(Math.random() * 8) + 10}:00`;
  const bookRes = await fetchAPI('/appointments', 'POST', {
    doctor_id: docRecord.rows[0].id,
    patient_id: pRecord.rows[0].id,
    appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    appointment_time: rndTime,
    type: 'ONLINE',
    symptoms: 'Test symptoms'
  }, patToken);
  
  console.log(`\n--- Test 4: Booking Default Status ---`);
  console.log(`Newly booked appointment status: ${bookRes.status} (Should be PENDING)`);
  const newAptId = bookRes.id;

  // Patient cancel
  const cancelRes = await fetchAPI(`/appointments/${newAptId}/status`, 'PUT', { status: 'CANCELLED' }, patToken);
  console.log(`\n--- Test 5: Patient Cancellation ---`);
  console.log(`Cancelled successfully? Status is now: ${cancelRes.status}`);

  // Reception moving an appointment
  console.log(`\n--- Test 6: Reception Flow ---`);
  const ptAptRes = await fetchAPI('/appointments', 'POST', {
    doctor_id: docRecord.rows[0].id,
    patient_id: pRecord.rows[0].id,
    appointment_date: new Date(Date.now() + 186400000).toISOString().split('T')[0],
    appointment_time: rndTime,
    type: 'ONLINE'
  }, patToken);
  
  const flowId = ptAptRes.id;
  await fetchAPI(`/appointments/${flowId}/status`, 'PUT', { status: 'CONFIRMED' }, recToken);
  console.log(`Status changed to CONFIRMED`);
  
  try {
     await fetchAPI(`/appointments/${flowId}/status`, 'PUT', { status: 'CANCELLED' }, patToken);
  } catch (err) {
     console.log(`Patient attempt to cancel CONFIRMED appointment: HTTP ${err.status} - ${err.message}`);
  }

  await fetchAPI(`/appointments/${flowId}/status`, 'PUT', { status: 'CHECKED_IN' }, recToken);
  console.log(`Status changed to CHECKED_IN`);
  
  await fetchAPI(`/appointments/${flowId}/status`, 'PUT', { status: 'IN_CONSULTATION' }, docToken);
  console.log(`Status changed to IN_CONSULTATION`);
  
  await fetchAPI(`/appointments/${flowId}/status`, 'PUT', { status: 'COMPLETED' }, docToken);
  console.log(`Status changed to COMPLETED`);

  await client.end();
  console.log('\nAll tests completed.');
}

runTests().catch(console.error);
