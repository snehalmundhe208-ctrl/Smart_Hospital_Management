const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const AuthRoutes = require('./src/routes/AuthRoutes');
const PatientRoutes = require('./src/routes/PatientRoutes');
const AppointmentRoutes = require('./src/routes/AppointmentRoutes');
const DoctorRoutes = require('./src/routes/DoctorRoutes');
const DashboardRoutes = require('./src/routes/DashboardRoutes');
const PharmacyRoutes = require('./src/routes/PharmacyRoutes');
const LabRoutes = require('./src/routes/LabRoutes');
const BillingRoutes = require('./src/routes/BillingRoutes');
const NotificationRoutes = require('./src/routes/NotificationRoutes');
const PrescriptionRoutes = require('./src/routes/PrescriptionRoutes');
const HospitalOpsRoutes = require('./src/routes/HospitalOpsRoutes');
const FeedbackRoutes = require('./src/routes/FeedbackRoutes');
const AuditRoutes = require('./src/routes/AuditRoutes');
const BannerRoutes = require('./src/routes/BannerRoutes');
const DepartmentRoutes = require('./src/routes/DepartmentRoutes');
const UploadRoutes = require('./src/routes/UploadRoutes');
const RefundRoutes = require('./src/routes/RefundRoutes');
const ServicePricingRoutes = require('./src/routes/ServicePricingRoutes');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Smart Hospital Management System API is running' });
});

// Future routes will go here
app.use('/api/auth', AuthRoutes);
app.use('/api/patients', PatientRoutes);
app.use('/api/appointments', AppointmentRoutes);
app.use('/api/doctors', DoctorRoutes);
app.use('/api/dashboard', DashboardRoutes);
app.use('/api/pharmacy', PharmacyRoutes);
app.use('/api/lab', LabRoutes);
app.use('/api/billing', BillingRoutes);
app.use('/api/notifications', NotificationRoutes);
app.use('/api/prescriptions', PrescriptionRoutes);
app.use('/api/hospital', HospitalOpsRoutes);
app.use('/api/feedback', FeedbackRoutes);
app.use('/api/audit', AuditRoutes);
app.use('/api/banners', BannerRoutes);
app.use('/api/departments', DepartmentRoutes);
app.use('/api/upload', UploadRoutes);
app.use('/api/refunds', RefundRoutes);
app.use('/api/service-prices', ServicePricingRoutes);

// Global Error Handlers
process.on('uncaughtException', (err) => {
  console.error('FATAL ERROR: Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL ERROR: Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Verify critical environment variables
if (!process.env.DATABASE_URL) {
  console.error('FATAL ERROR: DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// Start server if run directly (e.g., node index.js on Render) or not in production
if (require.main === module || process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
