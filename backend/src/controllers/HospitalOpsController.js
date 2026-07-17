const { pool } = require('../config/DatabaseConfig');
const { logActivity } = require('./AuditController');

// --- WARDS & BEDS ---
exports.getWards = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM wards ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addWard = async (req, res) => {
  try {
    const { name, type, capacity } = req.body;
    const result = await pool.query(
      'INSERT INTO wards (name, type, capacity) VALUES ($1, $2, $3) RETURNING *',
      [name, type, capacity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateWard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, capacity } = req.body;
    const result = await pool.query(
      'UPDATE wards SET name = $1, type = $2, capacity = $3 WHERE id = $4 RETURNING *',
      [name, type, capacity, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteWard = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM wards WHERE id = $1', [id]);
    res.json({ message: 'Ward deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getBedsByWard = async (req, res) => {
  try {
    const { wardId } = req.params;
    const result = await pool.query(`
      SELECT b.*, p.patient_id as patient_reg_id, u.first_name, u.last_name
      FROM beds b
      LEFT JOIN patients p ON b.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE b.ward_id = $1
      ORDER BY b.bed_number ASC
    `, [wardId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addBed = async (req, res) => {
  try {
    const { ward_id, bed_number } = req.body;
    const result = await pool.query(
      'INSERT INTO beds (ward_id, bed_number, status) VALUES ($1, $2, $3) RETURNING *',
      [ward_id, bed_number, 'AVAILABLE']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Bed number already exists in this ward' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateBedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, patient_id, bed_number } = req.body;
    
    // Check if bed exists
    const bedCheck = await pool.query('SELECT * FROM beds WHERE id = $1', [id]);
    if (bedCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Bed not found' });
    }

    let updates = [];
    let values = [];
    let idx = 1;

    if (bed_number !== undefined) {
      updates.push(`bed_number = $${idx++}`);
      values.push(bed_number);
    }

    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
      
      if (status === 'OCCUPIED' && patient_id) {
        updates.push(`patient_id = $${idx++}`);
        values.push(patient_id);
        updates.push(`admission_date = CURRENT_TIMESTAMP`);
      } else if (status === 'AVAILABLE') {
        updates.push(`patient_id = NULL`);
        updates.push(`discharge_date = CURRENT_TIMESTAMP`);
      }
    }

    if (updates.length === 0) {
       return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE beds SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    
    const result = await pool.query(query, values);
    
    await logActivity(req.user ? req.user.id : null, 'BED_ASSIGNMENT_UPDATED', `Updated bed ${id} status to ${status || bedCheck.rows[0].status}`, {
      module: 'HOSPITAL_OPS',
      ipAddress: req.ip,
      device: req.headers['user-agent'],
      previousValue: bedCheck.rows[0],
      newValue: result.rows[0]
    });

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Bed number already exists in this ward' });
    }
    console.error('updateBedStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateBed = exports.updateBedStatus;

exports.deleteBed = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM beds WHERE id = $1', [id]);
    res.json({ message: 'Bed deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- AMBULANCE ---
exports.getAmbulanceRequests = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ambulance_requests ORDER BY request_time DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createAmbulanceRequest = async (req, res) => {
  try {
    const { patient_name, phone, pickup_address } = req.body;
    const result = await pool.query(
      `INSERT INTO ambulance_requests (patient_name, phone, pickup_address)
       VALUES ($1, $2, $3) RETURNING *`,
      [patient_name, phone, pickup_address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateAmbulanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, driver_name, vehicle_number } = req.body;
    const result = await pool.query(
      `UPDATE ambulance_requests SET status = $1, driver_name = COALESCE($2, driver_name), vehicle_number = COALESCE($3, vehicle_number) WHERE id = $4 RETURNING *`,
      [status, driver_name, vehicle_number, id]
    );

    await logActivity(req.user ? req.user.id : null, 'AMBULANCE_REQUEST_UPDATED', `Updated ambulance request ${id} to ${status}`, {
      module: 'HOSPITAL_OPS',
      ipAddress: req.ip,
      device: req.headers['user-agent'],
      newValue: result.rows[0]
    });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- BLOOD BANK ---
exports.getBloodBankInventory = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blood_bank ORDER BY blood_group ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateBloodUnits = async (req, res) => {
  try {
    const { id } = req.params;
    const { units_available } = req.body;
    const result = await pool.query(
      'UPDATE blood_bank SET units_available = $1, last_updated = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [units_available, id]
    );

    await logActivity(req.user ? req.user.id : null, 'BLOOD_INVENTORY_UPDATED', `Updated blood inventory for group ${id} to ${units_available} units`, {
      module: 'HOSPITAL_OPS',
      ipAddress: req.ip,
      device: req.headers['user-agent'],
      newValue: result.rows[0]
    });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
