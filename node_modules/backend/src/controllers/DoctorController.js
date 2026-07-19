const db = require('../config/DatabaseConfig');
const bcrypt = require('bcryptjs');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url, dept.name as department_name,
             COALESCE(AVG(f.rating), 0) as average_rating, COUNT(f.id) as total_reviews
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN feedback f ON d.id = f.doctor_id
      GROUP BY d.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url, dept.name
      ORDER BY u.first_name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT d.*, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url, dept.name as department_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get doctor availability (booked slots)
// @route   GET /api/doctors/:id/availability
// @access  Public
const getDoctorAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // optional date filter
    
    let query = 'SELECT appointment_date, appointment_time FROM appointments WHERE doctor_id = $1 AND status != \'CANCELLED\'';
    const params = [id];
    
    if (date) {
      query += ' AND appointment_date = $2';
      params.push(date);
    }
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new doctor
// @route   POST /api/doctors
// @access  Private (Admin)
const createDoctor = async (req, res) => {
  const { first_name, last_name, email, phone, specialization, degree, department_id, experience_years, consultation_fee, available_days, shift_start, shift_end } = req.body;

  try {
    await db.query('BEGIN');
    
    // Check if user exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    
    const userResult = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, role, profile_image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [email, passwordHash, first_name, last_name, phone, 'DOCTOR', '/images/profiles/doctor-default.jpg']
    );
    const userId = userResult.rows[0].id;

    // Create Doctor
    const docResult = await db.query(
      `INSERT INTO doctors (user_id, department_id, specialization, degree, experience_years, consultation_fee, available_days, shift_start, shift_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [userId, department_id || null, specialization, degree || null, experience_years, consultation_fee, available_days, shift_start, shift_end]
    );

    await db.query('COMMIT');
    
    res.status(201).json({ message: 'Doctor created successfully', doctor: docResult.rows[0] });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error creating doctor' });
  }
};

// @desc    Update a doctor
// @route   PUT /api/doctors/:id
// @access  Private (Admin)
const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, phone, specialization, degree, department_id, experience_years, consultation_fee, available_days, shift_start, shift_end } = req.body;

  try {
    await db.query('BEGIN');

    // Get user_id
    const docRes = await db.query('SELECT user_id FROM doctors WHERE id = $1', [id]);
    if (docRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Doctor not found' });
    }
    const userId = docRes.rows[0].user_id;

    // Update User
    if (first_name || last_name || phone) {
      await db.query(
        'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), phone = COALESCE($3, phone) WHERE id = $4',
        [first_name, last_name, phone, userId]
      );
    }

    // Update Doctor
    const updatedDoc = await db.query(
      `UPDATE doctors SET 
        specialization = COALESCE($1, specialization),
        degree = COALESCE($2, degree),
        department_id = $3,
        experience_years = COALESCE($4, experience_years),
        consultation_fee = COALESCE($5, consultation_fee),
        available_days = COALESCE($6, available_days),
        shift_start = COALESCE($7, shift_start),
        shift_end = COALESCE($8, shift_end)
       WHERE id = $9 RETURNING *`,
      [specialization, degree, department_id || null, experience_years, consultation_fee, available_days, shift_start, shift_end, id]
    );

    await db.query('COMMIT');
    res.json(updatedDoc.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error updating doctor' });
  }
};

// @desc    Delete a doctor
// @route   DELETE /api/doctors/:id
// @access  Private (Admin)
const deleteDoctor = async (req, res) => {
  const { id } = req.params;
  try {
    const docRes = await db.query('SELECT user_id FROM doctors WHERE id = $1', [id]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Cascading delete on users table will delete the doctor record too
    await db.query('DELETE FROM users WHERE id = $1', [docRes.rows[0].user_id]);
    
    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting doctor' });
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  getDoctorAvailability,
  createDoctor,
  updateDoctor,
  deleteDoctor
};
