const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const scriptsDir = path.join(__dirname, 'scripts');
const migrationsDir = path.join(scriptsDir, 'migrations');
const testsDir = path.join(scriptsDir, 'tests');

if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir);
if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir);
if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir);

// 1. Rename files
const renames = [
  ['src/controllers/AppointmentController.js', 'src/controllers/AppointmentController.js'],
  ['src/controllers/AuditController.js', 'src/controllers/AuditController.js'],
  ['src/controllers/AuthController.js', 'src/controllers/AuthController.js'],
  ['src/controllers/BannerController.js', 'src/controllers/BannerController.js'],
  ['src/controllers/BillingController.js', 'src/controllers/BillingController.js'],
  ['src/controllers/DashboardController.js', 'src/controllers/DashboardController.js'],
  ['src/controllers/DepartmentController.js', 'src/controllers/DepartmentController.js'],
  ['src/controllers/DoctorController.js', 'src/controllers/DoctorController.js'],
  ['src/controllers/FeedbackController.js', 'src/controllers/FeedbackController.js'],
  ['src/controllers/HospitalOpsController.js', 'src/controllers/HospitalOpsController.js'],
  ['src/controllers/LabController.js', 'src/controllers/LabController.js'],
  ['src/controllers/NotificationController.js', 'src/controllers/NotificationController.js'],
  ['src/controllers/PatientController.js', 'src/controllers/PatientController.js'],
  ['src/controllers/PharmacyController.js', 'src/controllers/PharmacyController.js'],
  ['src/controllers/PrescriptionController.js', 'src/controllers/PrescriptionController.js'],
  ['src/controllers/RefundController.js', 'src/controllers/RefundController.js'],
  
  ['src/routes/AppointmentRoutes.js', 'src/routes/AppointmentRoutes.js'],
  ['src/routes/AuditRoutes.js', 'src/routes/AuditRoutes.js'],
  ['src/routes/AuthRoutes.js', 'src/routes/AuthRoutes.js'],
  ['src/routes/BannerRoutes.js', 'src/routes/BannerRoutes.js'],
  ['src/routes/BillingRoutes.js', 'src/routes/BillingRoutes.js'],
  ['src/routes/DashboardRoutes.js', 'src/routes/DashboardRoutes.js'],
  ['src/routes/DepartmentRoutes.js', 'src/routes/DepartmentRoutes.js'],
  ['src/routes/DoctorRoutes.js', 'src/routes/DoctorRoutes.js'],
  ['src/routes/FeedbackRoutes.js', 'src/routes/FeedbackRoutes.js'],
  ['src/routes/HospitalOpsRoutes.js', 'src/routes/HospitalOpsRoutes.js'],
  ['src/routes/LabRoutes.js', 'src/routes/LabRoutes.js'],
  ['src/routes/NotificationRoutes.js', 'src/routes/NotificationRoutes.js'],
  ['src/routes/PatientRoutes.js', 'src/routes/PatientRoutes.js'],
  ['src/routes/PharmacyRoutes.js', 'src/routes/PharmacyRoutes.js'],
  ['src/routes/PrescriptionRoutes.js', 'src/routes/PrescriptionRoutes.js'],
  ['src/routes/RefundRoutes.js', 'src/routes/RefundRoutes.js'],
  ['src/routes/UploadRoutes.js', 'src/routes/UploadRoutes.js'],

  ['src/middleware/AuthMiddleware.js', 'src/middleware/AuthMiddleware.js'],
  ['src/config/DatabaseConfig.js', 'src/config/DatabaseConfig.js'],
  ['seed/SeedDatabase.js', 'seed/SeedDatabase.js'],

  ['fix.js', 'scripts/migrations/MigrationFixMedicinesSchema.js'],
  ['fix_db.js', 'scripts/migrations/MigrationFixDbPharmacyBanners.js'],
  ['add_profile_fields.cjs', 'scripts/migrations/MigrationAddProfileFields.legacy.cjs'],
  ['add_profile_fields.js', 'scripts/migrations/MigrationAddProfileFields.js'],
  ['add_user.cjs', 'scripts/migrations/MigrationAddUser.cjs'],
  ['setup_lab.cjs', 'scripts/migrations/MigrationSetupLabRequest.cjs'],
  ['update_schema.js', 'scripts/migrations/MigrationUpdateAppointmentsConstraint.js'],

  ['test_db.js', 'scripts/tests/TestDatabaseConnection.js'],
  ['test_db2.js', 'scripts/tests/TestDatabaseConnection2.js'],
  ['test_api.cjs', 'scripts/tests/TestApi.cjs'],
  ['test_api_put.cjs', 'scripts/tests/TestApiPut.cjs'],
  ['check_prescriptions.js', 'scripts/tests/CheckPrescriptions.js'],
  ['check_prescriptions.cjs', 'scripts/tests/CheckPrescriptions.legacy.cjs'],
  ['check_prescriptions2.cjs', 'scripts/tests/CheckPrescriptions2.cjs'],
  ['check_prescriptions3.cjs', 'scripts/tests/CheckPrescriptions3.cjs'],
  ['check_schema.cjs', 'scripts/tests/CheckDatabaseSchema.cjs'],
  ['test_bug5.cjs', 'scripts/tests/TestBug5.cjs'],
  ['test_bug5_workflow.js', 'scripts/tests/TestBug5Workflow.js'],
  ['test_bug6.js', 'scripts/tests/TestBug6.js'],
  ['test_admin_doctors.js', 'scripts/tests/TestAdminDoctors.js'],
  ['test_frontend.cjs', 'scripts/tests/TestFrontend.cjs'],
  ['test_get_appts.cjs', 'scripts/tests/TestGetAppointments.cjs'],
  ['test_get_appts2.cjs', 'scripts/tests/TestGetAppointments2.cjs'],
  ['test_insert.js', 'scripts/tests/TestInsert.js'],
  ['test_local_db.js', 'scripts/tests/TestLocalDb.js'],
  ['test_local_passwords.js', 'scripts/tests/TestLocalPasswords.js'],
  ['test_login.cjs', 'scripts/tests/TestLogin.cjs'],
  ['test_login.js', 'scripts/tests/TestLogin.legacy.js'],
  ['test_orders.js', 'scripts/tests/TestOrders.js'],
  ['test_pharmacy.js', 'scripts/tests/TestPharmacy.js'],
  ['test_prescription.js', 'scripts/tests/TestPrescription.js'],
  ['test_report_bug4.js', 'scripts/tests/TestReportBug4.js'],
  ['test_ui_payload.cjs', 'scripts/tests/TestUiPayload.cjs'],
  ['check_constraint.cjs', 'scripts/tests/CheckConstraint.cjs'],
  ['check_lab.cjs', 'scripts/tests/CheckLab.cjs'],
  ['check_patients.cjs', 'scripts/tests/CheckPatients.cjs'],
  ['check_user.cjs', 'scripts/tests/CheckUser.cjs']
];

for (const [oldName, newName] of renames) {
  const oldPath = path.join(__dirname, oldName);
  const newPath = path.join(__dirname, newName);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log('Renamed: ' + oldName + ' -> ' + newName);
  }
}

// 2. Replace references in files
const replaceMap = [
  [/AuthController/g, 'AuthController'],
  [/PatientController/g, 'PatientController'],
  [/HospitalOpsController/g, 'HospitalOpsController'],
  [/AppointmentController/g, 'AppointmentController'],
  [/AuditController/g, 'AuditController'],
  [/BannerController/g, 'BannerController'],
  [/BillingController/g, 'BillingController'],
  [/DashboardController/g, 'DashboardController'],
  [/DepartmentController/g, 'DepartmentController'],
  [/DoctorController/g, 'DoctorController'],
  [/FeedbackController/g, 'FeedbackController'],
  [/LabController/g, 'LabController'],
  [/NotificationController/g, 'NotificationController'],
  [/PharmacyController/g, 'PharmacyController'],
  [/PrescriptionController/g, 'PrescriptionController'],
  [/RefundController/g, 'RefundController'],

  [/AuthRoutes/g, 'AuthRoutes'],
  [/PatientRoutes/g, 'PatientRoutes'],
  [/HospitalOpsRoutes/g, 'HospitalOpsRoutes'],
  [/AppointmentRoutes/g, 'AppointmentRoutes'],
  [/AuditRoutes/g, 'AuditRoutes'],
  [/BannerRoutes/g, 'BannerRoutes'],
  [/BillingRoutes/g, 'BillingRoutes'],
  [/DashboardRoutes/g, 'DashboardRoutes'],
  [/DepartmentRoutes/g, 'DepartmentRoutes'],
  [/DoctorRoutes/g, 'DoctorRoutes'],
  [/FeedbackRoutes/g, 'FeedbackRoutes'],
  [/LabRoutes/g, 'LabRoutes'],
  [/NotificationRoutes/g, 'NotificationRoutes'],
  [/PharmacyRoutes/g, 'PharmacyRoutes'],
  [/PrescriptionRoutes/g, 'PrescriptionRoutes'],
  [/RefundRoutes/g, 'RefundRoutes'],
  [/UploadRoutes/g, 'UploadRoutes'],

  [/\/middleware\/auth/g, '/middleware/AuthMiddleware'],
  [/\/config\/db/g, '/config/DatabaseConfig'],
  [/\.\.\/config\/db/g, '../config/DatabaseConfig'],
  [/\.\.\/\.\.\/src\/config\/db/g, '../../src/config/DatabaseConfig'],
  [/seed\/seed\.js/g, 'seed/SeedDatabase.js']
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules') {
        processDirectory(fullPath);
      }
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.cjs') || fullPath.endsWith('.json')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      for (const [regex, replacement] of replaceMap) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated references in: ' + fullPath);
      }
    }
  }
}

processDirectory(srcDir);
processDirectory(path.join(__dirname, 'seed'));
processDirectory(scriptsDir);
processDirectory(__dirname); // to process index.js and package.json

console.log('Refactoring complete.');
