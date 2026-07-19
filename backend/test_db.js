const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testStats() {
  try {
    const patientCount = await pool.query('SELECT COUNT(*) FROM patients');
    const doctorCount = await pool.query('SELECT COUNT(*) FROM doctors');
    const staffCount = await pool.query("SELECT COUNT(*) FROM users WHERE role NOT IN ('PATIENT', 'DOCTOR', 'ADMIN')");
    const appointmentCount = await pool.query('SELECT COUNT(*) FROM appointments');
    const revenue = await pool.query("SELECT SUM(net_amount) as total FROM invoices WHERE status = 'PAID'");
    const cancelledAptCount = await pool.query("SELECT COUNT(*) FROM appointments WHERE status = 'CANCELLED'");
    
    console.log(JSON.stringify({
        patients: parseInt(patientCount.rows[0].count),
        doctors: parseInt(doctorCount.rows[0].count),
        staff: parseInt(staffCount.rows[0].count),
        appointments: parseInt(appointmentCount.rows[0].count),
        revenue: parseFloat(revenue.rows[0].total || 0),
        cancelledAppointments: parseInt(cancelledAptCount.rows[0].count)
    }, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
testStats();
