const db = require('../config/DatabaseConfig');
const { createNotification } = require('./NotificationController');
const { logActivity } = require('./AuditController');

const isFutureAppointment = (date, time) => {
  let dateStr = date;
  if (date instanceof Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    dateStr = `${yyyy}-${mm}-${dd}`;
  } else if (typeof date === 'string' && date.includes('T')) {
    dateStr = date.split('T')[0];
  }
  return new Date(`${dateStr}T${String(time).slice(0, 5)}`).getTime() > Date.now();
};

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    let query = `
      SELECT a.*, 
        p.patient_id as patient_reg_id, pu.first_name as patient_first_name, pu.last_name as patient_last_name, pu.phone as patient_phone, p.blood_group,
        du.first_name as doctor_first_name, du.last_name as doctor_last_name, d.specialization, d.consultation_fee,
        (SELECT string_agg(l.test_name || ' (' || l.status || ')', ', ') FROM lab_requests l WHERE l.appointment_id = a.id) as lab_requests_summary
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
    `;
    const params = [];

    // Filter by role
    if (req.user.role === 'DOCTOR') {
      query += ` WHERE d.user_id = $1`;
      params.push(req.user.id);
    } else if (req.user.role === 'PATIENT') {
      query += ` WHERE p.user_id = $1`;
      params.push(req.user.id);
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create an appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
  try {
    const { doctor_id, patient_id, appointment_date, appointment_time, type, symptoms, firstName, lastName, age, gender, phone, bloodGroup } = req.body;
    
    let actualPatientId = patient_id;
    let actualUserId = req.user.id;
    
    // If a patient is creating, force the patient_id to their own
    if (req.user.role === 'PATIENT') {
      const pRes = await db.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
      if (pRes.rows.length > 0) {
        actualPatientId = pRes.rows[0].id;
      } else {
        return res.status(400).json({ message: 'Patient profile not found' });
      }
    } else if (patient_id) {
       // If admin/reception is creating, get the user_id of the patient
       const pRes = await db.query('SELECT user_id FROM patients WHERE id = $1', [patient_id]);
       if (pRes.rows.length > 0) {
         actualUserId = pRes.rows[0].user_id;
       }
    }

    if (!isFutureAppointment(appointment_date, appointment_time)) {
      return res.status(400).json({ message: 'Please choose a future appointment time' });
    }
    const conflict = await db.query(`
      SELECT id FROM appointments
      WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3
        AND status IN ('PENDING', 'CONFIRMED')
    `, [doctor_id, appointment_date, appointment_time]);
    if (conflict.rows.length > 0) {
      return res.status(409).json({ message: 'This doctor time slot is no longer available' });
    }

    // Save extended patient info
    if (firstName || lastName || phone) {
       await db.query(`
         UPDATE users SET 
           first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone)
         WHERE id = $4
       `, [firstName || null, lastName || null, phone || null, actualUserId]);
    }
    
    if (age || gender || bloodGroup) {
       let dob = null;
       if (age) {
          const d = new Date();
          d.setFullYear(d.getFullYear() - parseInt(age));
          dob = d.toISOString().split('T')[0];
       }
       await db.query(`
         UPDATE patients SET 
           dob = COALESCE($1, dob),
           gender = COALESCE($2, gender),
           blood_group = COALESCE($3, blood_group)
         WHERE id = $4
       `, [dob, gender || null, bloodGroup || null, actualPatientId]);
    }

    const result = await db.query(`
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, symptoms, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING *
    `, [actualPatientId, doctor_id, appointment_date, appointment_time, type || 'WALK_IN', symptoms]);
    
    // Notifications & Logs
    await createNotification(actualUserId, 'Appointment Booked', `Your appointment is booked for ${appointment_date} at ${appointment_time}.`, 'APPOINTMENT');
    
    const dRes = await db.query('SELECT user_id FROM doctors WHERE id = $1', [doctor_id]);
    if (dRes.rows.length > 0) {
       await createNotification(dRes.rows[0].user_id, 'New Appointment', `You have a new appointment on ${appointment_date} at ${appointment_time}.`, 'APPOINTMENT');
    }
    
    await logActivity(req.user.id, 'BOOK_APPOINTMENT', `Booked appointment ${result.rows[0].id} for ${appointment_date}`, {
      module: 'APPOINTMENTS',
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create Appointment Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Admin, Doctor, Receptionist)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { reason } = req.body; // Reason for cancellation if any

    if (req.user.role === 'PATIENT') {
      if (status !== 'CANCELLED') {
        return res.status(403).json({ message: 'Patients can only cancel their own appointments' });
      }
      const ownership = await db.query(`
        SELECT a.id, a.status, a.appointment_date, a.appointment_time FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.id = $1 AND p.user_id = $2
      `, [id, req.user.id]);
      if (ownership.rows.length === 0) {
        return res.status(403).json({ message: 'Not authorized to update this appointment' });
      }
      if (ownership.rows[0].status !== 'PENDING') {
        return res.status(403).json({ message: 'Only PENDING appointments can be cancelled by patients' });
      }
    }

    const result = await db.query(`
      UPDATE appointments 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Notify patient & process refunds
    const aptDetails = await db.query(`
      SELECT a.patient_id, a.doctor_id, a.payment_status, a.paid_amount, a.payment_reference, p.user_id as patient_user_id, d.user_id as doctor_user_id, a.appointment_date, a.appointment_time
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = $1
    `, [id]);
    
    if (aptDetails.rows.length > 0) {
      const details = aptDetails.rows[0];
      const patientUserId = details.patient_user_id;

      if (status === 'CANCELLED') {
        if (details.payment_status === 'PAID') {
          await db.query(`UPDATE appointments SET payment_status = 'REFUNDED' WHERE id = $1`, [id]);
          
          // Insert Refund Record
          await db.query(`
            INSERT INTO refunds (appointment_id, patient_id, doctor_id, cancelled_by, amount_paid, refund_amount, refund_status, transaction_id, reason)
            VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8)
          `, [id, details.patient_id, details.doctor_id, req.user.id, details.paid_amount || 0, details.paid_amount || 0, details.payment_reference, reason || 'Patient cancelled']);
          
          await createNotification(
            patientUserId,
            'Appointment cancelled & Refunded',
            `Your appointment scheduled for ${new Date(details.appointment_date).toLocaleDateString()} at ${details.appointment_time} has been cancelled. Your refund has been processed.`,
            'APPOINTMENT'
          );
        } else {
          await createNotification(
            patientUserId,
            'Appointment cancelled',
            `Your appointment scheduled for ${new Date(details.appointment_date).toLocaleDateString()} at ${details.appointment_time} has been cancelled.`,
            'APPOINTMENT'
          );
        }

        // Notify Doctor
        await createNotification(
          details.doctor_user_id,
          'Appointment cancelled',
          `The ${new Date(details.appointment_date).toLocaleDateString()} appointment at ${details.appointment_time} has been cancelled.`,
          'APPOINTMENT'
        );

        // Notify Admin & Receptionist
        const staffRes = await db.query(`SELECT id FROM users WHERE role IN ('ADMIN', 'RECEPTIONIST')`);
        for (const staff of staffRes.rows) {
          await createNotification(
            staff.id,
            'Appointment Cancelled',
            `Appointment ID ${id} was cancelled. ${details.payment_status === 'PAID' ? 'A refund was processed.' : ''}`,
            'SYSTEM'
          );
        }

      } else {
        await createNotification(
          patientUserId,
          `Appointment ${status}`,
          `Your appointment is now ${status}.`,
          'APPOINTMENT'
        );
      }
    }
    
    await logActivity(req.user.id, 'UPDATE_APPOINTMENT_STATUS', `Updated appointment ${id} to ${status}. ${reason ? 'Reason: ' + reason : ''}`, {
      module: 'APPOINTMENTS',
      ipAddress: req.ip,
      device: req.headers['user-agent'],
      previousValue: aptDetails.rows.length > 0 ? { status: aptDetails.rows[0].status } : null,
      newValue: { status }
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Pay for an appointment
// @route   POST /api/appointments/:id/pay
// @access  Private
const payForAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method } = req.body;

    const aptDetails = await db.query(`
      SELECT a.*, p.user_id as patient_user_id 
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = $1
    `, [id]);

    if (aptDetails.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (aptDetails.rows[0].patient_user_id !== req.user.id && req.user.role !== 'ADMIN') {
       return res.status(403).json({ message: 'Not authorized to pay for this appointment' });
    }

    const reference = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    // Create Invoice
    const invoiceRes = await db.query(`
      INSERT INTO invoices (patient_id, appointment_id, total_amount, net_amount, status, payment_method)
      VALUES ($1, $2, $3, $3, 'PAID', $4) RETURNING id
    `, [aptDetails.rows[0].patient_id, id, amount || 500, method || 'ONLINE']);
    const invoiceId = invoiceRes.rows[0].id;

    await db.query(`
      INSERT INTO invoice_items (invoice_id, description, amount, type)
      VALUES ($1, 'Consultation Fee', $2, 'CONSULTATION')
    `, [invoiceId, amount || 500]);

    const result = await db.query(`
      UPDATE appointments 
      SET payment_status = 'PAID', payment_reference = $1, paid_amount = $2, invoice_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 RETURNING *
    `, [reference, amount || 500, invoiceId, id]);
    
    await createNotification(req.user.id, 'Payment Successful', `Payment for your appointment on ${new Date(aptDetails.rows[0].appointment_date).toLocaleDateString()} was successful.`, 'BILLING');
    
    await logActivity(req.user.id, 'PAY_APPOINTMENT', `Paid ${amount} for appointment ${id} via ${method}`, {
      module: 'APPOINTMENTS',
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reschedule a patient's future appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private (Patient)
const rescheduleAppointment = async (req, res) => {
  try {
    const { appointment_date, appointment_time } = req.body;
    if (!isFutureAppointment(appointment_date, appointment_time)) {
      return res.status(400).json({ message: 'Please choose a future appointment time' });
    }
    const appointmentRes = await db.query(`
      SELECT a.*, p.user_id AS patient_user_id, d.user_id AS doctor_user_id
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = $1
    `, [req.params.id]);
    const appointment = appointmentRes.rows[0];
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.patient_user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
    if (!isFutureAppointment(appointment.appointment_date, appointment.appointment_time)) return res.status(400).json({ message: 'Past appointments cannot be rescheduled' });
    if (appointment.status === 'CANCELLED') return res.status(400).json({ message: 'Cancelled appointments cannot be rescheduled' });

    const conflict = await db.query(`
      SELECT id FROM appointments
      WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3
        AND status IN ('PENDING', 'CONFIRMED') AND id <> $4
    `, [appointment.doctor_id, appointment_date, appointment_time, appointment.id]);
    if (conflict.rows.length > 0) return res.status(409).json({ message: 'This doctor time slot is no longer available' });

    const result = await db.query(`
      UPDATE appointments SET appointment_date = $1, appointment_time = $2, status = 'PENDING', updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 RETURNING *
    `, [appointment_date, appointment_time, appointment.id]);
    await createNotification(req.user.id, 'Appointment rescheduled', `Your appointment has been moved to ${new Date(appointment_date).toLocaleDateString()} at ${appointment_time}.`, 'APPOINTMENT');
    await createNotification(appointment.doctor_user_id, 'Appointment rescheduled', `A patient appointment has been moved to ${new Date(appointment_date).toLocaleDateString()} at ${appointment_time}.`, 'APPOINTMENT');

    await logActivity(req.user.id, 'RESCHEDULE_APPOINTMENT', `Rescheduled appointment ${appointment.id} to ${appointment_date} ${appointment_time}`, {
      module: 'APPOINTMENTS',
      ipAddress: req.ip,
      device: req.headers['user-agent'],
      previousValue: { appointment_date: appointment.appointment_date, appointment_time: appointment.appointment_time },
      newValue: { appointment_date, appointment_time }
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to reschedule appointment' });
  }
};

module.exports = {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  payForAppointment
};
