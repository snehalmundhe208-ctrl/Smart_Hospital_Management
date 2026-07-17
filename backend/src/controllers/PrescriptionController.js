const db = require('../config/DatabaseConfig');
const { createNotification } = require('./NotificationController');
const { logActivity } = require('./AuditController');

// @desc    Get all prescriptions (role-filtered)
// @route   GET /api/prescriptions
// @access  Private
const getPrescriptions = async (req, res) => {
  try {
    let query = `
      SELECT pr.*, 
             pu.first_name as patient_first_name, pu.last_name as patient_last_name, p.patient_id as patient_reg_id,
             du.first_name as doctor_first_name, du.last_name as doctor_last_name, d.specialization,
             dept.name AS department_name, a.appointment_date, a.symptoms
      FROM prescriptions pr
      JOIN patients p ON pr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON pr.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN appointments a ON pr.appointment_id = a.id
    `;
    const params = [];

    if (req.user.role === 'PATIENT') {
      query += ` WHERE p.user_id = $1`;
      params.push(req.user.id);
    } else if (req.user.role === 'DOCTOR') {
      query += ` WHERE d.user_id = $1`;
      params.push(req.user.id);
    }

    query += ` ORDER BY pr.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get prescription by ID with items
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prescriptionRes = await db.query(`
      SELECT pr.*, 
             pu.first_name as patient_first_name, pu.last_name as patient_last_name, pu.email as patient_email, p.patient_id as patient_reg_id,
             du.first_name as doctor_first_name, du.last_name as doctor_last_name, d.specialization,
             dept.name AS department_name, a.appointment_date, a.symptoms
      FROM prescriptions pr
      JOIN patients p ON pr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON pr.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN appointments a ON pr.appointment_id = a.id
      WHERE pr.id = $1
    `, [id]);

    if (prescriptionRes.rows.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const prescription = prescriptionRes.rows[0];

    // Check access rights
    if (req.user.role === 'PATIENT') {
      const pRes = await db.query('SELECT user_id FROM patients WHERE id = $1', [prescription.patient_id]);
      if (pRes.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role === 'DOCTOR') {
      const dRes = await db.query('SELECT user_id FROM doctors WHERE id = $1', [prescription.doctor_id]);
      if (dRes.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    }

    // Get items
    const itemsRes = await db.query(`
      SELECT pi.*
      FROM prescription_items pi
      WHERE pi.prescription_id = $1
    `, [id]);

    prescription.items = itemsRes.rows;
    res.json(prescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res) => {
  try {
    console.log('--- createPrescription called ---');
    console.log('req.body:', req.body);
    
    const { appointment_id, patient_id, diagnosis, notes, medical_findings, conclusion, follow_up_date, requires_certificate, rest_days, items } = req.body;
    const safeItems = items || [];

    // Verify doctor identity
    const dRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (dRes.rows.length === 0) {
      return res.status(403).json({ message: 'Only registered doctors can create prescriptions' });
    }
    const doctorId = dRes.rows[0].id;

    await db.query('BEGIN');

    const reportNumber = `NCR-${Date.now()}-${String(patient_id).slice(0, 4).toUpperCase()}`;
    
    console.log('Inserting into prescriptions...');
    const prescriptionRes = await db.query(`
      INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, diagnosis, notes, report_number, medical_findings, conclusion, follow_up_date, requires_certificate, rest_days)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *
    `, [appointment_id || null, patient_id || null, doctorId, diagnosis, notes || '', reportNumber, medical_findings || null, conclusion || null, follow_up_date || null, requires_certificate || false, rest_days || 0]);

    const prescriptionId = prescriptionRes.rows[0].id;

    console.log('Inserting items...', safeItems);
    for (let item of safeItems) {
      await db.query(`
        INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [prescriptionId, item.medicine_name || '', item.dosage || '', item.frequency || '', item.duration || '', item.instructions || '']);
    }

    await db.query('COMMIT');
    console.log('Prescription committed');

    // Notify patient
    try {
      const pRes = await db.query('SELECT user_id FROM patients WHERE id = $1', [patient_id]);
      if (pRes.rows.length > 0) {
        await createNotification(
          pRes.rows[0].user_id,
          'New Prescription Issued',
          `Your doctor has issued a new prescription for: ${diagnosis}. You can view it in your dashboard.`,
          'PRESCRIPTION'
        );
      }
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    await logActivity(req.user.id, 'CREATE_PRESCRIPTION', `Created prescription ${prescriptionRes.rows[0].id} for diagnosis: ${diagnosis}`, {
      module: 'CLINICAL',
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });

    res.status(201).json(prescriptionRes.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('createPrescription ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update a doctor's clinical report
// @route   PUT /api/prescriptions/:id
// @access  Private (Doctor)
const updatePrescription = async (req, res) => {
  try {
    const doctorRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorRes.rows.length === 0) return res.status(403).json({ message: 'Only registered doctors can update medical reports' });
    const existingRes = await db.query('SELECT * FROM prescriptions WHERE id = $1 AND doctor_id = $2', [req.params.id, doctorRes.rows[0].id]);
    const existing = existingRes.rows[0];
    if (!existing) return res.status(404).json({ message: 'Medical report not found' });
    const { diagnosis, notes, medical_findings, conclusion, follow_up_date, requires_certificate, rest_days } = req.body;
    const result = await db.query(`
      UPDATE prescriptions SET diagnosis = COALESCE($1, diagnosis), notes = COALESCE($2, notes),
        medical_findings = COALESCE($3, medical_findings), conclusion = COALESCE($4, conclusion),
        follow_up_date = COALESCE($5, follow_up_date)
      WHERE id = $6 RETURNING *
    `, [diagnosis, notes, medical_findings, conclusion, follow_up_date, requires_certificate, rest_days, req.params.id]);
    const patientRes = await db.query('SELECT user_id FROM patients WHERE id = $1', [existing.patient_id]);
    if (patientRes.rows[0]) {
      await createNotification(patientRes.rows[0].user_id, 'Medical report updated', `Your doctor has updated the medical report for ${result.rows[0].diagnosis}.`, 'PRESCRIPTION');
    }

    await logActivity(req.user.id, 'UPDATE_PRESCRIPTION', `Updated prescription ${existing.id}`, {
      module: 'CLINICAL',
      ipAddress: req.ip,
      device: req.headers['user-agent'],
      previousValue: { diagnosis: existing.diagnosis, notes: existing.notes },
      newValue: { diagnosis: result.rows[0].diagnosis, notes: result.rows[0].notes }
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update medical report' });
  }
};

module.exports = {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription
};


