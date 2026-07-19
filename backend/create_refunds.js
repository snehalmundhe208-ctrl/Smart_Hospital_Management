const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refunds (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          appointment_id UUID REFERENCES appointments(id),
          patient_id UUID REFERENCES patients(id),
          doctor_id UUID REFERENCES doctors(id),
          cancelled_by UUID REFERENCES users(id),
          amount_paid DECIMAL(10, 2),
          refund_amount DECIMAL(10, 2),
          refund_status VARCHAR(50),
          transaction_id VARCHAR(255),
          reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Refunds table created successfully.');
  } catch (err) {
    console.error(err.message);
  } finally { pool.end(); }
}
run();
