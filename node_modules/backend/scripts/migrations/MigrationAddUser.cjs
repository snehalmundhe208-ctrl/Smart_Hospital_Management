const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres123@localhost:5432/smart_hospital' });
async function run() {
  const hash = await bcrypt.hash('meloni', 10);
  const res = await pool.query(`INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES ('narendra@gmail.com', $1, 'PATIENT', 'Narendra', 'User') RETURNING id`, [hash]);
  const userId = res.rows[0].id;
  await pool.query(`INSERT INTO patients (user_id, patient_id, dob, gender) VALUES ($1, 'PT-NARENDRA', '1980-01-01', 'Male')`, [userId]);
  console.log('User added');
  process.exit(0);
}
run();
