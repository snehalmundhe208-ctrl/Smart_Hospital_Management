const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres123@localhost:5432/smart_hospital' });
pool.query("SELECT * FROM users WHERE email = 'narendra@gmail.com'").then(res => { console.log(res.rows); process.exit(0); });
