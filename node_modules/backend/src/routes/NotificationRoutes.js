const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/NotificationController');
const { protect } = require('../middleware/AuthMiddleware');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
