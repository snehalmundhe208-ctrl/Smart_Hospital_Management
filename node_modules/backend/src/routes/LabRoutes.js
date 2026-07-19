const express = require('express');
const router = express.Router();
const { getLabRequests, updateLabRequest } = require('../controllers/LabController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.get('/requests', protect, getLabRequests);
router.put('/requests/:id', protect, authorize('ADMIN', 'LAB'), updateLabRequest);

module.exports = router;
