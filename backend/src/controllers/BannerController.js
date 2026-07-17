const db = require('../config/DatabaseConfig');

// @desc    Get all active banners (Public)
// @route   GET /api/banners
// @access  Public
const getBanners = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM pharmacy_banners WHERE is_active = true ORDER BY display_order ASC, created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching banners' });
  }
};

// @desc    Get all banners including inactive (Admin)
// @route   GET /api/banners/admin
// @access  Private/Admin
const getAllBannersAdmin = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM pharmacy_banners ORDER BY display_order ASC, created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching banners' });
  }
};

// @desc    Create a new banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = async (req, res) => {
  const { title, subtitle, button_text, image_url, is_active, display_order } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO pharmacy_banners (title, subtitle, button_text, image_url, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, subtitle, button_text, image_url, is_active ?? true, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating banner' });
  }
};

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, button_text, image_url, is_active, display_order } = req.body;
  
  try {
    const result = await db.query(
      `UPDATE pharmacy_banners 
       SET title = COALESCE($1, title),
           subtitle = COALESCE($2, subtitle),
           button_text = COALESCE($3, button_text),
           image_url = COALESCE($4, image_url),
           is_active = COALESCE($5, is_active),
           display_order = COALESCE($6, display_order),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [title, subtitle, button_text, image_url, is_active, display_order, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating banner' });
  }
};

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM pharmacy_banners WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.json({ message: 'Banner removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting banner' });
  }
};

module.exports = {
  getBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner
};
