const express = require('express');
const router = express.Router();
const { getAppointments, createAppointment, updateAppointmentStatus, rescheduleAppointment, payForAppointment } = require('../controllers/AppointmentController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.route('/')
  .get(protect, getAppointments)
  .post(protect, createAppointment);

router.put('/:id/status', protect, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'), updateAppointmentStatus);
router.put('/:id/reschedule', protect, authorize('PATIENT'), rescheduleAppointment);
router.post('/:id/pay', protect, authorize('PATIENT', 'ADMIN'), payForAppointment);

module.exports = router;
