const { Client } = require('pg');
require('dotenv').config({ path: '.env' });
async function check() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query("SELECT email, password_hash, role FROM users WHERE role = 'PATIENT'");
  console.log("Patients:", res.rows);
  await client.end();
}
check().catch(console.error);
