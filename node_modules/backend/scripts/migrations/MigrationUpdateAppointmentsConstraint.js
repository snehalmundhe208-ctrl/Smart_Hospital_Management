require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  await pool.query('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check');
  await pool.query('ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN (\'PENDING\', \'CONFIRMED\', \'CHECKED_IN\', \'IN_CONSULTATION\', \'COMPLETED\', \'CANCELLED\'))');
  console.log('Constraint updated');
  process.exit(0);
}
run();
