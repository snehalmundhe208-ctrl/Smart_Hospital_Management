const db = require('../config/DatabaseConfig');
const { createNotification } = require('./NotificationController');

// @desc    Get all lab requests
// @route   GET /api/lab/requests
// @access  Private (Admin, Lab, Doctor, Patient)
const getLabRequests = async (req, res) => {
  try {
    let query = `
      SELECT l.*, i.status as payment_status,
        p.patient_id as patient_reg_id, pu.first_name as patient_first_name, pu.last_name as patient_last_name, pu.phone as patient_phone,
        du.first_name as doctor_first_name, du.last_name as doctor_last_name,
        a.status as appointment_status
      FROM lab_requests l
      LEFT JOIN invoices i ON l.invoice_id = i.id
      JOIN patients p ON l.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON l.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      LEFT JOIN appointments a ON l.appointment_id = a.id
    `;
    const params = [];

    if (req.user.role === 'PATIENT') {
        const pRes = await db.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
        if(pRes.rows.length > 0) {
            query += ` WHERE l.patient_id = $1 AND l.status = 'COMPLETED' AND (a.status = 'COMPLETED' OR a.id IS NULL)`;
            params.push(pRes.rows[0].id);
        } else {
            return res.json([]);
        }
    } else if (req.user.role === 'DOCTOR') {
        const dRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
        if(dRes.rows.length > 0) {
            query += ` WHERE l.doctor_id = $1`;
            params.push(dRes.rows[0].id);
        } else {
            return res.json([]);
        }
    }

    query += ` ORDER BY l.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create lab requests
// @route   POST /api/lab/requests
// @access  Private (Doctor)
const createLabRequest = async (req, res) => {
  try {
    const { appointment_id, patient_id, tests, notes, priority } = req.body;
    
    const dRes = await db.query('SELECT id, user_id FROM doctors WHERE user_id = $1', [req.user.id]);
    const doctor_id = dRes.rows.length > 0 ? dRes.rows[0].id : null;

    // Fetch Lab Test price
    const priceRes = await db.query("SELECT price FROM service_prices WHERE service_type = 'LAB_TEST' AND is_active = true");
    const labTestPrice = priceRes.rows.length > 0 ? priceRes.rows[0].price : 500;

    const insertedRequests = [];
    for (const testName of tests) {
      // Create a separate invoice for each lab test so they can be paid individually
      const invoiceRes = await db.query(`
        INSERT INTO invoices (patient_id, appointment_id, total_amount, net_amount, status, payment_method)
        VALUES ($1, $2, $3, $3, 'UNPAID', 'PENDING') RETURNING id
      `, [patient_id, appointment_id, labTestPrice]);
      const invoiceId = invoiceRes.rows[0].id;

      await db.query(`
        INSERT INTO invoice_items (invoice_id, description, amount, type)
        VALUES ($1, $2, $3, 'LAB_TEST')
      `, [invoiceId, \`Lab Test: \${testName}\`, labTestPrice]);

      const result = await db.query(`
        INSERT INTO lab_requests (appointment_id, patient_id, doctor_id, test_name, notes, priority, status, invoice_id)
        VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7)
        RETURNING *
      `, [appointment_id, patient_id, doctor_id, testName, notes, priority || 'Normal', invoiceId]);
      insertedRequests.push(result.rows[0]);
    }

    // Set appointment status to IN_CONSULTATION
    await db.query(`UPDATE appointments SET status = 'IN_CONSULTATION' WHERE id = $1 AND status != 'COMPLETED'`, [appointment_id]);

    // Notify patient
    const pRes = await db.query('SELECT user_id FROM patients WHERE id = $1', [patient_id]);
    if (pRes.rows.length > 0) {
      const { createNotification } = require('./NotificationController');
      await createNotification(
        pRes.rows[0].user_id,
        'Lab Tests Requested',
        `Your doctor has requested ${tests.length} lab test(s). Please pay the outstanding bills in your dashboard to proceed.`,
        'LAB'
      );
    }

    const { logActivity } = require('./AuditController');
    await logActivity(req.user.id, 'LAB_REQUEST_CREATED', `Created ${tests.length} lab requests for appointment ${appointment_id}`, {
      module: 'LAB',
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });

    res.status(201).json(insertedRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update lab request status & report
// @route   PUT /api/lab/requests/:id
// @access  Private (Admin, Lab)
const updateLabRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, report_url, technician_name } = req.body;
    
    let finalStatus = status;
    if (report_url && (!status || status === 'PENDING')) {
      finalStatus = 'COMPLETED';
    }

    const oldRequestRes = await db.query('SELECT status, report_url, technician_name FROM lab_requests WHERE id = $1', [id]);
    const previousValue = oldRequestRes.rows[0];

    const result = await db.query(`
      UPDATE lab_requests 
      SET status = COALESCE($1, status), 
          report_url = COALESCE($2, report_url), 
          technician_name = COALESCE($3, technician_name),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 RETURNING *
    `, [finalStatus, report_url, technician_name, id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Lab request not found' });

    // Notify patient and doctor
    const labRes = await db.query(`
      SELECT l.patient_id, p.user_id as patient_user_id, l.test_name, d.user_id as doctor_user_id
      FROM lab_requests l
      JOIN patients p ON l.patient_id = p.id
      LEFT JOIN doctors d ON l.doctor_id = d.id
      WHERE l.id = $1
    `, [id]);
    
    if (labRes.rows.length > 0) {
      const patientUserId = labRes.rows[0].patient_user_id;
      const testName = labRes.rows[0].test_name;
      await createNotification(
        patientUserId,
        `Lab Report Status: ${finalStatus || result.rows[0].status}`,
        report_url 
          ? `Your lab report for ${testName} is now available.`
          : `Your lab request for ${testName} has been updated to ${finalStatus || result.rows[0].status}.`,
        'LAB'
      );
      if (labRes.rows[0].doctor_user_id && report_url) {
        await createNotification(
          labRes.rows[0].doctor_user_id,
          'Lab Report Ready',
          `Lab report for ${testName} has been uploaded and is ready for your review.`,
          'LAB'
        );
      }
    }

    const { logActivity } = require('./AuditController');
    await logActivity(req.user.id, 'LAB_REQUEST_UPDATED', `Updated lab request ${id} to ${finalStatus}`, {
      module: 'LAB',
      ipAddress: req.ip,
      device: req.headers['user-agent'],
      previousValue,
      newValue: { status: result.rows[0].status, report_url: result.rows[0].report_url, technician_name: result.rows[0].technician_name }
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getLabRequests,
  updateLabRequest,
  createLabRequest
};
