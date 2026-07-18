const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/postgres" });
pool.query('SELECT datname FROM pg_database').then(res => { console.log(res.rows); process.exit(0); }).catch(err => { console.error(err.message); process.exit(1); });
