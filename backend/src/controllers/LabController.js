const db = require('../config/DatabaseConfig');
const { createNotification } = require('./NotificationController');

// @desc    Get all lab requests
// @route   GET /api/lab/requests
// @access  Private (Admin, Lab, Doctor, Patient)
const getLabRequests = async (req, res) => {
  try {
    let query = `
      SELECT l.*, p.patient_id as patient_reg_id, u.first_name as patient_first_name, u.last_name as patient_last_name,
      d.first_name as doctor_first_name, d.last_name as doctor_last_name, l.technician_name,
      a.status as appointment_status
      FROM lab_requests l
      JOIN patients p ON l.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN doctors doc ON l.doctor_id = doc.id
      LEFT JOIN users d ON doc.user_id = d.id
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

    // Notify patient
    const labRes = await db.query(`
      SELECT l.patient_id, p.user_id as patient_user_id, l.test_name
      FROM lab_requests l
      JOIN patients p ON l.patient_id = p.id
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
  updateLabRequest
};
