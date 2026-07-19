import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminPatients from './pages/AdminPatients';
import AdminDoctors from './pages/AdminDoctors';
import AdminMedicines from './pages/AdminMedicines';
import AdminServicePricing from './pages/AdminServicePricing';
import PatientDashboard from './pages/PatientDashboard';
import PatientProfile from './pages/PatientProfile';
import Profile from './pages/Profile';
import DoctorDashboard from './pages/DoctorDashboard';
import BookAppointment from './pages/BookAppointment';
import AppointmentsList from './pages/AppointmentsList';
import ReceptionDashboard from './pages/ReceptionDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import LabDashboard from './pages/LabDashboard';
import WardsBedsDashboard from './pages/WardsBedsDashboard';
import AmbulanceDashboard from './pages/AmbulanceDashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';
import AdminSettings from './pages/AdminSettings';
import MedicineOrders from './pages/MedicineOrders';
import PatientMedicines from './pages/PatientMedicines';
import Reviews from './pages/Reviews';
import HelpGuide from './pages/HelpGuide';
import AIAssistant from './components/AIAssistant';
import AuditLogsDashboard from './pages/AuditLogsDashboard';
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

const PR = (roles, Comp) => <ProtectedRoute allowedRoles={roles}><Comp /></ProtectedRoute>;

function App() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  
  return (
    <>
    <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff' } }} />
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/help"     element={PR(null, HelpGuide)} />

      {/* Admin */}
      <Route path="/admin"          element={PR(['ADMIN'], AdminDashboard)} />
      <Route path="/admin/patients" element={PR(['ADMIN'], AdminPatients)} />
      <Route path="/admin/doctors"    element={PR(['ADMIN'], AdminDoctors)} />
      <Route path="/admin/medicines"      element={PR(['ADMIN'], AdminMedicines)} />
      <Route path="/admin/wards"      element={PR(['ADMIN'], WardsBedsDashboard)} />
      <Route path="/admin/ambulance"  element={PR(['ADMIN'], AmbulanceDashboard)} />
      <Route path="/admin/blood-bank" element={PR(['ADMIN'], BloodBankDashboard)} />
      <Route path="/admin/settings"   element={PR(['ADMIN'], AdminSettings)} />
      <Route path="/admin/reviews"   element={PR(['ADMIN'], Reviews)} />
      <Route path="/admin/audit"     element={PR(['ADMIN'], AuditLogsDashboard)} />
      <Route path="/admin/profile"   element={PR(['ADMIN'], Profile)} />
      <Route path="/admin/service-pricing" element={PR(['ADMIN'], AdminServicePricing)} />
      {/* Doctor */}
      <Route path="/doctor"              element={PR(['DOCTOR'], DoctorDashboard)} />
      <Route path="/doctor/appointments" element={PR(['DOCTOR'], AppointmentsList)} />
      <Route path="/doctor/reviews" element={PR(['DOCTOR'], Reviews)} />
      <Route path="/doctor/profile" element={PR(['DOCTOR'], Profile)} />

      {/* Patient */}
      <Route path="/patient"                  element={PR(['PATIENT'], PatientDashboard)} />
      <Route path="/patient/health-profile"   element={PR(['PATIENT'], PatientProfile)} />
      <Route path="/patient/profile"          element={PR(['PATIENT'], Profile)} />
      <Route path="/patient/appointments"     element={PR(['PATIENT'], AppointmentsList)} />
      <Route path="/patient/book-appointment" element={PR(['PATIENT'], BookAppointment)} />
      <Route path="/patient/medicines"           element={PR(['PATIENT'], PatientMedicines)} />
      <Route path="/patient/medicine-orders"           element={PR(['PATIENT'], MedicineOrders)} />

      {/* Reception */}
      <Route path="/reception"              element={PR(['RECEPTIONIST'], ReceptionDashboard)} />
      <Route path="/reception/appointments" element={PR(['RECEPTIONIST'], AppointmentsList)} />
      <Route path="/reception/wards"        element={PR(['RECEPTIONIST'], WardsBedsDashboard)} />
      <Route path="/reception/ambulance"    element={PR(['RECEPTIONIST'], AmbulanceDashboard)} />
      <Route path="/reception/profile"      element={PR(['RECEPTIONIST'], Profile)} />
      {/* Pharmacy */}
      <Route path="/pharmacy" element={PR(['PHARMACY'], PharmacyDashboard)} />
      <Route path="/pharmacy/orders" element={PR(['PHARMACY'], MedicineOrders)} />
      <Route path="/pharmacy/profile" element={PR(['PHARMACY'], Profile)} />

      {/* Lab */}
      <Route path="/lab"            element={PR(['LAB'], LabDashboard)} />
      <Route path="/lab/blood-bank" element={PR(['LAB'], BloodBankDashboard)} />
      <Route path="/lab/profile"    element={PR(['LAB'], Profile)} />

      <Route path="/unauthorized" element={
        <div className="flex h-screen items-center justify-center flex-col gap-4">
          <p className="text-3xl font-bold text-red-500">403 — Unauthorized</p>
          <a href="/login" className="text-primary-600 underline">Go to Login</a>
        </div>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
    {user && <AIAssistant />}
    </>
  );
}

export default App;
