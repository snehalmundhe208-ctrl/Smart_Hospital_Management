const db = require('../config/DatabaseConfig');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public or Private
const getDepartments = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM departments ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDepartments
};
