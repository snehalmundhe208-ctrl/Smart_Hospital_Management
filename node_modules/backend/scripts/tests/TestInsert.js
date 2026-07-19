const db = require('./src/config/DatabaseConfig');

async function run() {
  try {
    const res = await db.query('SELECT a.id as appointment_id, a.patient_id, d.id as doctor_id FROM appointments a JOIN doctors d ON a.doctor_id = d.id LIMIT 1');
    const appt = res.rows[0];
    console.log('Appt:', appt);

    const reportNumber = `NCR-${Date.now()}-${String(appt.patient_id).slice(0, 4).toUpperCase()}`;

    await db.query('BEGIN');

    const prescriptionRes = await db.query(`
        INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, diagnosis, notes, report_number, medical_findings, conclusion, follow_up_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
      `, [appt.appointment_id, appt.patient_id, appt.doctor_id, 'Test', 'Test notes', reportNumber, 'Test findings', 'Test conclusion', '2026-10-10']);

    const prescriptionId = prescriptionRes.rows[0].id;
    console.log('Prescription Created:', prescriptionId);

    await db.query(`
        INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [prescriptionId, 'Med', '10mg', 'Daily', '1 week', 'Take']);

    await db.query('ROLLBACK');
    console.log('Success (rolled back)');
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
}
run();
