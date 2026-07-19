const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, payInvoice, payBulkInvoices, payAppointment } = require('../controllers/BillingController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.route('/invoices')
  .get(protect, authorize('ADMIN', 'RECEPTIONIST', 'PATIENT'), getInvoices)
  .post(protect, authorize('ADMIN', 'RECEPTIONIST'), createInvoice);

router.put('/invoices/bulk-pay', protect, authorize('ADMIN', 'RECEPTIONIST', 'PATIENT'), payBulkInvoices);
router.put('/invoices/:id/pay', protect, authorize('ADMIN', 'RECEPTIONIST', 'PATIENT'), payInvoice);
router.post('/appointments/:id/pay', protect, authorize('PATIENT'), payAppointment);

module.exports = router;
