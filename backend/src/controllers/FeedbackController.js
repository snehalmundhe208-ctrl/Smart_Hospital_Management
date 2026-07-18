const db = require('../config/DatabaseConfig');
const { createNotification } = require('./NotificationController');
const { logActivity } = require('./AuditController');

exports.submitFeedback = async (req, res) => {
  try {
    const { appointment_id, rating, review } = req.body;
    
    // Find the appointment to link patient and doctor
    const aptRes = await db.query('SELECT patient_id, doctor_id FROM appointments WHERE id = $1', [appointment_id]);
    if (aptRes.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });
    
    const { patient_id, doctor_id } = aptRes.rows[0];
    
    // Verify patient owns the appointment
    const pRes = await db.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
    if (pRes.rows.length === 0 || pRes.rows[0].id !== patient_id) {
        return res.status(403).json({ message: 'Not authorized to review this appointment' });
    }

    const newFeedback = await db.query(`
      INSERT INTO feedback (patient_id, doctor_id, appointment_id, rating, review)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [patient_id, doctor_id, appointment_id, rating, review]);
    
    // Notify Doctor
    const dRes = await db.query('SELECT user_id FROM doctors WHERE id = $1', [doctor_id]);
    if (dRes.rows.length > 0) {
       await createNotification(dRes.rows[0].user_id, 'New Feedback Received', `You received a ${rating}-star review.`, 'USER');
    }
    
    await logActivity(req.user.id, 'SUBMIT_FEEDBACK', `Submitted a ${rating}-star review for appointment ${appointment_id}`);

    res.status(201).json(newFeedback.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getDoctorFeedback = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await db.query(`
      SELECT f.*, u.first_name, u.last_name 
      FROM feedback f
      JOIN patients p ON f.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE f.doctor_id = $1
      ORDER BY f.created_at DESC
    `, [doctorId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT f.*, 
        pu.first_name as patient_first_name, pu.last_name as patient_last_name,
        du.first_name as doctor_first_name, du.last_name as doctor_last_name
      FROM feedback f
      JOIN patients p ON f.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON f.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      ORDER BY f.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPublicTestimonials = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT f.rating, f.review, f.created_at, pu.first_name, pu.last_name, du.first_name as doctor_first_name, du.last_name as doctor_last_name
      FROM feedback f
      JOIN patients p ON f.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON f.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE f.rating >= 4 AND f.review IS NOT NULL AND f.review != ''
      ORDER BY f.created_at DESC LIMIT 6
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
