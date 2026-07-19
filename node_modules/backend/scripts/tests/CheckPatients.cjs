const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/smart_hospital' });
async function run() {
  const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patients';`);
  console.log(res.rows);
  process.exit(0);
}
run();
