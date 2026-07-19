const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/DashboardController');
const { protect } = require('../middleware/AuthMiddleware');

router.get('/stats', protect, getDashboardStats);

module.exports = router;
