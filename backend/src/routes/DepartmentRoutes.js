const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/DepartmentController');

router.route('/')
  .get(DepartmentController.getDepartments);

module.exports = router;
