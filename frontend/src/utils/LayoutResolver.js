import AdminLayout from '../layouts/AdminLayout';
import DoctorLayout from '../layouts/DoctorLayout';
import PatientLayout from '../layouts/PatientLayout';
import ReceptionLayout from '../layouts/ReceptionLayout';
import PharmacyLayout from '../layouts/PharmacyLayout';
import LabLayout from '../layouts/LabLayout';

export const getLayoutForRole = (role) => {
  switch (role) {
    case 'ADMIN': return AdminLayout;
    case 'DOCTOR': return DoctorLayout;
    case 'PATIENT': return PatientLayout;
    case 'RECEPTIONIST': return ReceptionLayout;
    case 'PHARMACY': return PharmacyLayout;
    case 'LAB': return LabLayout;
    default: return PatientLayout;
  }
};
