const db = require('../config/DatabaseConfig');

// @desc    Get all service prices
// @route   GET /api/service-prices
// @access  Private
const getServicePrices = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM service_prices ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a service price
// @route   PUT /api/service-prices/:id
// @access  Private (Admin)
const updateServicePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, is_active } = req.body;
    
    const result = await db.query(`
      UPDATE service_prices 
      SET price = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 RETURNING *
    `, [price, is_active, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getServicePrices,
  updateServicePrice
};
