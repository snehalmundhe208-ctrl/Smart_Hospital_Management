(async () => {
  const db = require('./src/config/DatabaseConfig');
  try {
    const res = await db.query("SELECT email FROM users WHERE role = 'PATIENT' LIMIT 1");
    if (res.rows.length === 0) throw new Error('No patient found');
    const email = res.rows[0].email;
    console.log('Patient email:', email);
    
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!' })
    });
    const data = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${data.message || loginRes.statusText}`);
    
    const config = { headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' } };
    
    // Fetch medicines to add to cart
    const medRes = await fetch('http://localhost:5000/api/pharmacy/medicines', config);
    const medicines = await medRes.json();
    const med = medicines[0];
    
    // Create store order
    const orderReq = {
      items: [{ medicine_id: med.id, quantity: 1 }],
      payment_method: 'CARD'
    };
    
    const orderRes = await fetch('http://localhost:5000/api/pharmacy/store-orders', {
      method: 'POST', ...config, body: JSON.stringify(orderReq)
    });
    const orderData = await orderRes.json();
    console.log('Store Order result:', orderRes.status, 'Invoice created:', !!orderData.invoice);
    
    // Fetch orders
    const getOrdersRes = await fetch('http://localhost:5000/api/pharmacy/orders', config);
    const getOrdersData = await getOrdersRes.json();
    console.log('Total Orders fetched for patient:', getOrdersData.length);
    console.log('Orders data sample:', JSON.stringify(getOrdersData[0], null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
})();
