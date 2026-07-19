const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testAllAdminStats() {
  try {
    const patientCount = await pool.query('SELECT COUNT(*) FROM patients');
    const doctorCount = await pool.query('SELECT COUNT(*) FROM doctors');
    const staffCount = await pool.query("SELECT COUNT(*) FROM users WHERE role NOT IN ('PATIENT', 'DOCTOR', 'ADMIN')");
    const appointmentCount = await pool.query('SELECT COUNT(*) FROM appointments');
    const revenue = await pool.query("SELECT SUM(net_amount) as total FROM invoices WHERE status = 'PAID'");
    const cancelledAptCount = await pool.query("SELECT COUNT(*) FROM appointments WHERE status = 'CANCELLED'");
    const refundsStats = await pool.query("SELECT COUNT(*) as refund_count, SUM(refund_amount) as total_refund FROM refunds");
    
    const revTrends = await pool.query(`
      SELECT DATE(created_at) as date, SUM(net_amount) as total
      FROM invoices WHERE status = 'PAID' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at) ORDER BY date ASC
    `);
    const aptTrends = await pool.query(`
      SELECT DATE(appointment_date) as date, COUNT(*) as count
      FROM appointments WHERE appointment_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(appointment_date) ORDER BY date ASC
    `);
    
    const deptStats = await pool.query(`
      SELECT dept.name, COUNT(DISTINCT a.patient_id) as patients
      FROM departments dept
      LEFT JOIN doctors d ON d.department_id = dept.id
      LEFT JOIN appointments a ON a.doctor_id = d.id
      GROUP BY dept.name ORDER BY patients DESC
    `);
    
    const aptStatus = await pool.query(`
      SELECT status as name, CAST(COUNT(*) AS INTEGER) as value
      FROM appointments
      GROUP BY status
    `);
    
    const monthlyApt = await pool.query(`
      SELECT TO_CHAR(appointment_date, 'Mon') as month, COUNT(*) as count
      FROM appointments WHERE appointment_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(appointment_date, 'Mon'), EXTRACT(MONTH FROM appointment_date)
      ORDER BY EXTRACT(MONTH FROM appointment_date)
    `);

    console.log("All queries executed successfully!");
  } catch (err) {
    console.error("ERROR IN QUERY:");
    console.error(err);
  } finally {
    pool.end();
  }
}
testAllAdminStats();
