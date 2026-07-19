(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hospital.com', password: 'Password123!' })
    });
    const data = await res.json();
    
    const config = { headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' } };
    
    // Fetch departments
    const deptsRes = await fetch('http://localhost:5000/api/departments', config);
    if (!deptsRes.ok) throw new Error(`Departments fetch failed`);
    const departments = await deptsRes.json();
    
    // Test Add Doctor
    const newDoc = {
      first_name: 'Test', last_name: 'Doc', email: 'testdoc' + Date.now() + '@hospital.com', phone: '9999999999',
      specialization: 'Neurologist', degree: 'MD, DM', department_id: departments[0]?.id || 1,
      experience_years: 10, consultation_fee: 1000, available_days: 'Mon,Wed,Fri', shift_start: '10:00', shift_end: '16:00'
    };
    
    console.log('Adding Doctor...');
    const addRes = await fetch('http://localhost:5000/api/doctors', { method: 'POST', ...config, body: JSON.stringify(newDoc) });
    if (!addRes.ok) throw new Error(`Add failed: ${await addRes.text()}`);
    const addedDoc = await addRes.json();
    console.log('Doctor added:', addedDoc.doctor.id);
    
    // Test Edit Doctor
    console.log('Editing Doctor...');
    const editRes = await fetch(`http://localhost:5000/api/doctors/${addedDoc.doctor.id}`, { 
      method: 'PUT', ...config, 
      body: JSON.stringify({ degree: 'MD, DM, PhD', experience_years: 12 }) 
    });
    if (!editRes.ok) throw new Error(`Edit failed: ${await editRes.text()}`);
    console.log('Doctor edited successfully');
    
    // Test Delete Doctor
    console.log('Deleting Doctor...');
    const delRes = await fetch(`http://localhost:5000/api/doctors/${addedDoc.doctor.id}`, { method: 'DELETE', ...config });
    if (!delRes.ok) throw new Error(`Delete failed: ${await delRes.text()}`);
    console.log('Doctor deleted successfully');
    
  } catch (err) {
    console.error('Error:', err);
  }
})();
