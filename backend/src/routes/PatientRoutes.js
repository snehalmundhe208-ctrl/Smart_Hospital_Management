const express = require('express');
const router = express.Router();
const { getPatients, getPatientById, updatePatient } = require('../controllers/PatientController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.get('/', protect, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), getPatients);
router.get('/:id', protect, getPatientById);
router.put('/:id', protect, updatePatient);

module.exports = router;
