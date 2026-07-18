const express = require('express');
const router = express.Router();
const { getRefunds } = require('../controllers/RefundController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.route('/')
  .get(protect, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'), getRefunds);

module.exports = router;
