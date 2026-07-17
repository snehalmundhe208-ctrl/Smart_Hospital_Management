const db = require('../config/DatabaseConfig');

// @desc    Get all patients (for Admin, Doctor, Reception)
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url 
      FROM patients p 
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url 
      FROM patients p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Check access rights: Patient can only view their own profile, others can view any
    if (req.user.role === 'PATIENT') {
        const userPatient = await db.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
        if(userPatient.rows.length > 0 && userPatient.rows[0].id !== id) {
             return res.status(403).json({ message: 'Not authorized to view this patient profile' });
        }
    }

    const patient = result.rows[0];
    const [appointmentsRes, reportsRes, labReportsRes, invoicesRes, ordersRes] = await Promise.all([
      db.query(`
        SELECT a.*, du.first_name AS doctor_first_name, du.last_name AS doctor_last_name, d.specialization
        FROM appointments a JOIN doctors d ON a.doctor_id = d.id JOIN users du ON d.user_id = du.id
        WHERE a.patient_id = $1 ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `, [id]),
      db.query(`
        SELECT pr.*, du.first_name AS doctor_first_name, du.last_name AS doctor_last_name, d.specialization, dept.name AS department_name,
               a.symptoms, a.appointment_date
        FROM prescriptions pr JOIN doctors d ON pr.doctor_id = d.id JOIN users du ON d.user_id = du.id
        LEFT JOIN departments dept ON d.department_id = dept.id LEFT JOIN appointments a ON pr.appointment_id = a.id
        WHERE pr.patient_id = $1 ORDER BY pr.created_at DESC
      `, [id]),
      db.query('SELECT * FROM lab_requests WHERE patient_id = $1 ORDER BY created_at DESC', [id]),
      db.query('SELECT * FROM invoices WHERE patient_id = $1 ORDER BY created_at DESC', [id]),
      db.query('SELECT * FROM medicine_orders WHERE patient_id = $1 ORDER BY created_at DESC', [id]),
    ]);
    const reports = await Promise.all(reportsRes.rows.map(async (report) => {
      const items = await db.query('SELECT * FROM prescription_items WHERE prescription_id = $1', [report.id]);
      return { ...report, items: items.rows };
    }));
    const invoices = await Promise.all(invoicesRes.rows.map(async (invoice) => {
      const items = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
      return { ...invoice, items: items.rows };
    }));
    patient.medical_history = {
      appointments: appointmentsRes.rows,
      reports,
      lab_reports: labReportsRes.rows,
      invoices,
      medicine_orders: ordersRes.rows,
    };
    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update patient profile
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      address, emergency_contact_name, emergency_contact_phone, 
      blood_group, allergies, chronic_diseases, family_history 
    } = req.body;
    
    const oldPatientRes = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
    const previousValue = oldPatientRes.rows[0];

    const result = await db.query(`
      UPDATE patients 
      SET 
        address = COALESCE($1, address),
        emergency_contact_name = COALESCE($2, emergency_contact_name),
        emergency_contact_phone = COALESCE($3, emergency_contact_phone),
        blood_group = COALESCE($4, blood_group),
        allergies = COALESCE($5, allergies),
        chronic_diseases = COALESCE($6, chronic_diseases),
        family_history = COALESCE($7, family_history),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 RETURNING *
    `, [address, emergency_contact_name, emergency_contact_phone, blood_group, allergies, chronic_diseases, family_history, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const newValue = result.rows[0];

    const { logActivity } = require('./AuditController');
    await logActivity(req.user.id, 'PATIENT_RECORD_UPDATED', `Updated patient record ${id}`, {
      module: 'PATIENTS',
      ipAddress: req.ip,
      device: req.headers['user-agent'],
      previousValue,
      newValue
    });

    res.json(newValue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  updatePatient
};
