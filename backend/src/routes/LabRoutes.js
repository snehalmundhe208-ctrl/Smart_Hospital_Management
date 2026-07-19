const express = require('express');
const router = express.Router();
const { getLabRequests, updateLabRequest, createLabRequest } = require('../controllers/LabController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.get('/requests', protect, getLabRequests);
router.post('/requests', protect, authorize('DOCTOR'), createLabRequest);
router.put('/requests/:id', protect, authorize('ADMIN', 'LAB'), updateLabRequest);

module.exports = router;
