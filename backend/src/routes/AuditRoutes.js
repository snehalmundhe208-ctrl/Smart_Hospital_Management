const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/AuditController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.get('/stats', protect, authorize('ADMIN'), AuditController.getAuditStats);
router.post('/client-event', protect, AuditController.logClientEvent);
router.get('/', protect, authorize('ADMIN'), AuditController.getAuditLogs);

module.exports = router;
