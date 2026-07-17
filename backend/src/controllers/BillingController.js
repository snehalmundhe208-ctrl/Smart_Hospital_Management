const db = require('../config/DatabaseConfig');
const { createNotification } = require('./NotificationController');

// @desc    Get all invoices
// @route   GET /api/billing/invoices
// @access  Private (Admin, Receptionist)
const getInvoices = async (req, res) => {
  try {
    let query = `
      SELECT i.*, p.patient_id as patient_reg_id, u.first_name, u.last_name 
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      JOIN users u ON p.user_id = u.id
    `;
    const params = [];
    if (req.user.role === 'PATIENT') {
      query += ' WHERE p.user_id = $1';
      params.push(req.user.id);
    }
    query += ' ORDER BY i.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Pay for an appointment and confirm it
// @route   POST /api/billing/appointments/:id/pay
// @access  Private (Patient)
const payAppointment = async (req, res) => {
  try {
    const { payment_method } = req.body;
    if (!['CARD', 'UPI', 'NET_BANKING'].includes(payment_method)) {
      return res.status(400).json({ message: 'Choose a valid online payment method' });
    }

    const appointmentRes = await db.query(`
      SELECT a.*, p.user_id AS patient_user_id, p.patient_id AS patient_reg_id,
             d.consultation_fee, d.user_id AS doctor_user_id,
             du.first_name AS doctor_first_name, du.last_name AS doctor_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE a.id = $1
    `, [req.params.id]);
    const appointment = appointmentRes.rows[0];
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.patient_user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized to pay for this appointment' });
    if (appointment.status === 'CANCELLED') return res.status(400).json({ message: 'Cancelled appointments cannot be paid' });

    if (appointment.payment_status === 'PAID') {
      const invoiceRes = appointment.invoice_id ? await db.query('SELECT * FROM invoices WHERE id = $1', [appointment.invoice_id]) : { rows: [] };
      return res.json({ appointment, invoice: invoiceRes.rows[0] || null });
    }

    const amount = Number(appointment.consultation_fee || 0);
    const paymentReference = `APT-${Date.now()}-${String(appointment.id).slice(0, 6).toUpperCase()}`;
    const invoiceRes = await db.query(`
      INSERT INTO invoices (patient_id, appointment_id, total_amount, net_amount, status, payment_method)
      VALUES ($1, $2, $3, $3, 'PAID', $4) RETURNING *
    `, [appointment.patient_id, appointment.id, amount, payment_method]);
    const invoice = invoiceRes.rows[0];
    await db.query(
      `INSERT INTO invoice_items (invoice_id, description, amount, type) VALUES ($1, $2, $3, 'CONSULTATION')`,
      [invoice.id, `Consultation with Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}`, amount]
    );
    const updateRes = await db.query(`
      UPDATE appointments
      SET payment_status = 'PAID', payment_reference = $1, paid_amount = $2, invoice_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 RETURNING *
    `, [paymentReference, amount, invoice.id, appointment.id]);

    await createNotification(req.user.id, 'Appointment confirmed', `Your consultation payment was received. Your appointment with Dr. ${appointment.doctor_last_name} is confirmed.`, 'BILLING');
    await createNotification(appointment.doctor_user_id, 'Paid appointment confirmed', `A paid appointment has been confirmed for ${appointment.appointment_date} at ${appointment.appointment_time}.`, 'APPOINTMENT');

    res.json({ appointment: updateRes.rows[0], invoice: { ...invoice, items: [{ description: `Consultation with Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}`, amount, type: 'CONSULTATION' }] } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to complete appointment payment' });
  }
};

// @desc    Create an invoice
// @route   POST /api/billing/invoices
// @access  Private (Admin, Receptionist)
const createInvoice = async (req, res) => {
  try {
    const { patient_id, appointment_id, items, discount, tax } = req.body;
    
    // items should be array of { description, amount, type }
    let totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    let netAmount = totalAmount - (parseFloat(discount) || 0) + (parseFloat(tax) || 0);

    await db.query('BEGIN');
    const invoiceRes = await db.query(`
      INSERT INTO invoices (patient_id, appointment_id, total_amount, discount, tax, net_amount, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'UNPAID') RETURNING *
    `, [patient_id, appointment_id, totalAmount, discount || 0, tax || 0, netAmount]);
    
    const invoiceId = invoiceRes.rows[0].id;

    for (let item of items) {
      await db.query(`
        INSERT INTO invoice_items (invoice_id, description, amount, type)
        VALUES ($1, $2, $3, $4)
      `, [invoiceId, item.description, item.amount, item.type]);
    }

    await db.query('COMMIT');

    // Notify patient
    const patRes = await db.query('SELECT user_id FROM patients WHERE id = $1', [patient_id]);
    if (patRes.rows.length > 0) {
      await createNotification(
        patRes.rows[0].user_id,
        'New Invoice Issued',
        `An invoice of $${netAmount} has been generated for your recent visit.`,
        'BILLING'
      );
    }

    res.status(201).json(invoiceRes.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update invoice status (Pay)
// @route   PUT /api/billing/invoices/:id/pay
// @access  Private (Admin, Receptionist)
const payInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.body;
    
    const result = await db.query(`
        UPDATE invoices SET status = 'PAID', payment_method = $1 WHERE id = $2 RETURNING *
    `, [payment_method, id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Invoice not found' });

    // Notify patient
    const invRes = await db.query(`
      SELECT i.net_amount, p.user_id as patient_user_id
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.id = $1
    `, [id]);
    
    if (invRes.rows.length > 0) {
      await createNotification(
        invRes.rows[0].patient_user_id,
        'Invoice Paid Successfully',
        `Payment of $${invRes.rows[0].net_amount} has been received via ${payment_method}. Thank you!`,
        'BILLING'
      );
    }

    res.json(result.rows[0]);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getInvoices,
  createInvoice,
  payInvoice,
  payAppointment
};
