const express = require('express');
const router = express.Router();
const { getDoctors, getDoctorById, getDoctorAvailability, createDoctor, updateDoctor, deleteDoctor } = require('../controllers/DoctorController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/availability', getDoctorAvailability);

// Admin routes
router.post('/', protect, authorize('ADMIN'), createDoctor);
router.put('/:id', protect, authorize('ADMIN'), updateDoctor);
router.delete('/:id', protect, authorize('ADMIN'), deleteDoctor);

module.exports = router;
