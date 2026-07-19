const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres123@localhost:5432/smart_hospital' });
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='lab_requests'").then(res => { console.log(res.rows.map(r => r.column_name)); process.exit(0); });
