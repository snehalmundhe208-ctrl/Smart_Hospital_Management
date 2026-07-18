const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres123@localhost:5432/smart_hospital' });
pool.query("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'appointments_type_check'")
.then(res => { console.log(res.rows); process.exit(0); })
.catch(e => { console.log(e); process.exit(0); });
