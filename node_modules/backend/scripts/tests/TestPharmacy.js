(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pharmacy1@hospital.com', password: 'Password123!' })
    });
    const data = await res.json();
    console.log('Login Result:', data.user);
    
    if (!data.token) {
      console.log('Login failed', data);
      return;
    }
    const statRes = await fetch('http://localhost:5000/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${data.token}` }
    });
    const statData = await statRes.json();
    console.log('Dashboard Stats Result:', Object.keys(statData));
  } catch (err) {
    console.error('Error:', err);
  }
})();
