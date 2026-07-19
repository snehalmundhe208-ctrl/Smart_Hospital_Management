const fs = require('fs');

async function runTest() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // 1. Login Patient
    let pRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'narendra@gmail.com', password: 'meloni' })
    });
    let pData = await pRes.json();
    let patToken = pData.token;
    
    // 2. Fetch doctors to get an ID
    let docRes = await fetch(`${baseURL}/doctors`, {
        headers: { Authorization: `Bearer ${patToken}` }
    });
    let doctors = await docRes.json();
    let doctorId = doctors[0].id;
    
    // 3. Book appointment
    console.log('Booking appointment...');
    let bookRes = await fetch(`${baseURL}/appointments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${patToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            doctor_id: doctorId,
            appointment_date: new Date().toISOString().split('T')[0],
            appointment_time: '23:05',
            type: 'ONLINE',
            symptoms: 'Fever'
        })
    });
    let newAppt = await bookRes.json();
    console.log('New Appointment:', newAppt);
    
    // 4. Login Receptionist
    let rRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception1@hospital.com', password: 'Password123!' })
    });
    let rData = await rRes.json();
    let recToken = rData.token;
    
    // 5. Fetch appointments as receptionist
    let recApptsRes = await fetch(`${baseURL}/appointments`, {
        headers: { Authorization: `Bearer ${recToken}` }
    });
    let recAppts = await recApptsRes.json();
    let foundAppt = recAppts.find(a => a.id === newAppt.id);
    console.log('Receptionist sees new appointment:', !!foundAppt, foundAppt ? foundAppt.status : 'N/A');
    
    // 6. Receptionist confirms the appointment
    console.log('Receptionist confirms appointment...');
    let confirmRes = await fetch(`${baseURL}/appointments/${newAppt.id}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${recToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' })
    });
    let confirmedAppt = await confirmRes.json();
    console.log('Confirmed status:', confirmedAppt.status);
    
    // 7. Login Doctor
    let docEmail = doctors[0].email || 'doctor1@hospital.com';
    let docLoginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: docEmail, password: 'Password123!' })
    });
    let dData = await docLoginRes.json();
    let docToken = dData.token;
    
    // 8. Fetch appointments as doctor
    let docApptsRes = await fetch(`${baseURL}/appointments`, {
        headers: { Authorization: `Bearer ${docToken}` }
    });
    let docAppts = await docApptsRes.json();
    let docFoundAppt = docAppts.find(a => a.id === newAppt.id);
    console.log('Doctor sees confirmed appointment:', !!docFoundAppt, docFoundAppt ? docFoundAppt.status : 'N/A');
    
  } catch(e) {
      console.error(e);
  }
}
runTest();
