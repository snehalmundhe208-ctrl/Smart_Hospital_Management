const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/FeedbackController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.get('/public', FeedbackController.getPublicTestimonials);
router.post('/', protect, authorize('PATIENT'), FeedbackController.submitFeedback);
router.get('/doctor/:doctorId', protect, authorize('ADMIN', 'DOCTOR'), FeedbackController.getDoctorFeedback);
router.get('/', protect, authorize('ADMIN'), FeedbackController.getAllFeedback);

module.exports = router;
