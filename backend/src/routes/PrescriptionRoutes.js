const express = require('express');
const router = express.Router();
const { getPrescriptions, getPrescriptionById, createPrescription, updatePrescription } = require('../controllers/PrescriptionController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.get('/', protect, getPrescriptions);
router.get('/:id', protect, getPrescriptionById);
router.post('/', protect, authorize('ADMIN', 'DOCTOR'), createPrescription);
router.put('/:id', protect, authorize('DOCTOR'), updatePrescription);

module.exports = router;
