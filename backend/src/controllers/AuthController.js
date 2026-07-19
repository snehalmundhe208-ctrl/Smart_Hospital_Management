const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/DatabaseConfig');
const { logActivity } = require('./AuditController');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await logActivity(user.id, 'USER_LOGIN', `User ${user.email} logged in`, {
      module: 'AUTH',
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });

    res.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      profile_image_url: user.profile_image_url,
      token: generateToken(user.id, user.role),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const register = async (req, res) => {
  const { email, password, first_name, last_name, phone, role } = req.body;
  
  try {
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, role, profile_image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, first_name, last_name, role, profile_image_url',
      [email, passwordHash, first_name, last_name, phone, role || 'PATIENT', '/images/profiles/patient-01.jpg']
    );
    
    const user = result.rows[0];

    // If role is patient, also create a patient record
    if (user.role === 'PATIENT') {
      const patientId = `SHMS-PT-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.query(
        'INSERT INTO patients (user_id, patient_id, dob, gender) VALUES ($1, $2, $3, $4)',
        [user.id, patientId, req.body.dob || '2000-01-01', req.body.gender || 'Other']
      );
    }

    await logActivity(user.id, 'USER_REGISTRATION', `New user registered: ${user.email}`, {
      module: 'AUTH',
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });

    res.status(201).json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      profile_image_url: user.profile_image_url,
      token: generateToken(user.id, user.role),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await db.query('SELECT id, first_name, last_name, email, role, phone, profile_image_url, dob, gender, address, emergency_contact, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const { first_name, last_name, phone, dob, gender, address, emergency_contact, profile_image_url, password } = req.body;
  try {
    const validDob = dob ? dob : null;
    let query = 'UPDATE users SET first_name = $1, last_name = $2, phone = $3, dob = $4, gender = $5, address = $6, emergency_contact = $7, profile_image_url = $8';
    let values = [first_name, last_name, phone, validDob, gender, address, emergency_contact, profile_image_url];
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      query += ', password_hash = $9 WHERE id = $10 RETURNING id, first_name, last_name, email, role, phone, profile_image_url, dob, gender, address, emergency_contact';
      values.push(passwordHash, req.user.id);
    } else {
      query += ' WHERE id = $9 RETURNING id, first_name, last_name, email, role, phone, profile_image_url, dob, gender, address, emergency_contact';
      values.push(req.user.id);
    }
    
    const oldUserRes = await db.query('SELECT first_name, last_name, phone, dob, gender, address, emergency_contact, profile_image_url FROM users WHERE id = $1', [req.user.id]);
    const previousValue = oldUserRes.rows[0];

    const result = await db.query(query, values);
    const newValue = result.rows[0];

    await logActivity(req.user.id, password ? 'PASSWORD_CHANGED' : 'PROFILE_UPDATED', password ? 'User changed password' : 'User updated profile', {
      module: 'AUTH',
      ipAddress: req.ip,
      device: req.headers['user-agent'],
      previousValue: password ? null : previousValue,
      newValue: password ? null : newValue
    });

    res.json(newValue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports = { login, register, getMe, updateProfile };
