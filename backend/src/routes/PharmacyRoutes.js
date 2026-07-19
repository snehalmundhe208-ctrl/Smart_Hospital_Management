const express = require('express');
const router = express.Router();
const {
  getMedicines,
  addMedicine,
  updateStock,
  getPrescriptionMedicineOptions,
  createPrescriptionOrder,
  getMedicineOrders,
  updateMedicineOrderStatus,
  createStoreOrder,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/PharmacyController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.route('/medicines')
  .get(protect, getMedicines)
  .post(protect, authorize('ADMIN', 'PHARMACY'), addMedicine);

router.put('/medicines/:id/stock', protect, authorize('ADMIN', 'PHARMACY'), updateStock);
router.put('/medicines/:id', protect, authorize('ADMIN', 'PHARMACY'), updateMedicine);
router.delete('/medicines/:id', protect, authorize('ADMIN', 'PHARMACY'), deleteMedicine);
router.get('/prescription-medicines', protect, authorize('PATIENT'), getPrescriptionMedicineOptions);
router.get('/orders', protect, authorize('ADMIN', 'PHARMACY', 'PATIENT'), getMedicineOrders);
router.post('/orders', protect, authorize('PATIENT'), createPrescriptionOrder);
router.post('/store-orders', protect, authorize('PATIENT'), createStoreOrder);
router.put('/orders/:id', protect, authorize('ADMIN', 'PHARMACY'), updateMedicineOrderStatus);

module.exports = router;
