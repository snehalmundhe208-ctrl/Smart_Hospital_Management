const db = require('../config/DatabaseConfig');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *
    `, [id, req.user.id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Notification not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a centralized notification
// Helper function to be called from other controllers internally, NOT an API route usually
// But we could expose it for Admin/System.
const createNotification = async (userId, title, message, type) => {
    try {
        await db.query(`
            INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)
        `, [userId, title, message, type]);
    } catch(err) {
        console.error('Failed to create notification', err);
    }
}

module.exports = {
  getNotifications,
  markAsRead,
  createNotification
};
