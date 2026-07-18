const db = require('../config/DatabaseConfig');

// @desc    Get all refunds
// @route   GET /api/refunds
// @access  Private
const getRefunds = async (req, res) => {
  try {
    let query = `
      SELECT r.*,
        pu.first_name as patient_first_name, pu.last_name as patient_last_name,
        du.first_name as doctor_first_name, du.last_name as doctor_last_name,
        cu.first_name as cancelled_by_first_name, cu.last_name as cancelled_by_last_name,
        cu.role as cancelled_by_role
      FROM refunds r
      JOIN patients p ON r.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON r.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      LEFT JOIN users cu ON r.cancelled_by = cu.id
    `;
    const params = [];

    // Filter by role
    if (req.user.role === 'DOCTOR') {
      const dRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
      if (dRes.rows.length > 0) {
        query += ` WHERE r.doctor_id = $1`;
        params.push(dRes.rows[0].id);
      } else {
        return res.json([]);
      }
    } else if (req.user.role === 'PATIENT') {
      const pRes = await db.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
      if (pRes.rows.length > 0) {
        query += ` WHERE r.patient_id = $1`;
        params.push(pRes.rows[0].id);
      } else {
        return res.json([]);
      }
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('getRefunds error:', error);
    res.status(500).json({ message: 'Server error fetching refunds' });
  }
};

module.exports = {
  getRefunds
};
