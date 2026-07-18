const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Make sure we read .env
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/smart_hospital' });

async function run() {
  try {
    const res = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'prescriptions';`);
    console.log(res.rows);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
