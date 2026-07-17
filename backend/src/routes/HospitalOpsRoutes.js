const express = require('express');
const router = express.Router();
const HospitalOpsController = require('../controllers/HospitalOpsController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.use(protect);

// Wards
router.get('/wards', authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), HospitalOpsController.getWards);
router.post('/wards', authorize('ADMIN'), HospitalOpsController.addWard);
router.put('/wards/:id', authorize('ADMIN'), HospitalOpsController.updateWard);
router.delete('/wards/:id', authorize('ADMIN'), HospitalOpsController.deleteWard);

// Beds
router.get('/wards/:wardId/beds', authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), HospitalOpsController.getBedsByWard);
router.post('/beds', authorize('ADMIN', 'RECEPTIONIST'), HospitalOpsController.addBed);
router.put('/beds/:id/status', authorize('ADMIN', 'RECEPTIONIST'), HospitalOpsController.updateBedStatus);
router.put('/beds/:id', authorize('ADMIN', 'RECEPTIONIST'), HospitalOpsController.updateBed);
router.delete('/beds/:id', authorize('ADMIN', 'RECEPTIONIST'), HospitalOpsController.deleteBed);

// Ambulance
router.get('/ambulance', authorize('ADMIN', 'RECEPTIONIST'), HospitalOpsController.getAmbulanceRequests);
router.post('/ambulance', authorize('ADMIN', 'RECEPTIONIST', 'PATIENT'), HospitalOpsController.createAmbulanceRequest);
router.put('/ambulance/:id', authorize('ADMIN', 'RECEPTIONIST'), HospitalOpsController.updateAmbulanceStatus);

// Blood Bank
router.get('/blood-bank', authorize('ADMIN', 'DOCTOR', 'LAB'), HospitalOpsController.getBloodBankInventory);
router.put('/blood-bank/:id', authorize('ADMIN', 'LAB'), HospitalOpsController.updateBloodUnits);

module.exports = router;
