const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres123@localhost:5432/smart_hospital' });
pool.query("SELECT email, password_hash FROM users WHERE role = 'LAB'")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(e => { console.log(e); process.exit(0); });
