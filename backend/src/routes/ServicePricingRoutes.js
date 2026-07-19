const express = require('express');
const router = express.Router();
const { getServicePrices, updateServicePrice } = require('../controllers/ServicePricingController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.get('/', protect, authorize('ADMIN', 'RECEPTIONIST'), getServicePrices);
router.put('/:id', protect, authorize('ADMIN'), updateServicePrice);

module.exports = router;
