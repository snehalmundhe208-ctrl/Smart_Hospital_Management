import React, { useState, useEffect, useContext } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import DoctorLayout from '../layouts/DoctorLayout';
import PatientLayout from '../layouts/PatientLayout';
import ReceptionLayout from '../layouts/ReceptionLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Clock, User, CheckCircle, XCircle, Download, CalendarPlus, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import ReportModal from '../components/ReportModal';
import RescheduleModal from '../components/RescheduleModal';
import FeedbackModal from '../components/FeedbackModal';
import { downloadInvoiceReceipt, downloadMedicalCertificate } from '../utils/exportUtils';
import toast from 'react-hot-toast';

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportModalApt, setReportModalApt] = useState(null);
  const [rescheduleModalApt, setRescheduleModalApt] = useState(null);
  const [feedbackModalApt, setFeedbackModalApt] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.get('/api/appointments', config);
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put(`/api/appointments/${id}/status`, { status }, config);
      toast.success(`Appointment ${status.toLowerCase()} successfully`);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating status', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getLayoutDetails = () => {
    switch(user?.role) {
      case 'ADMIN': return { Layout: AdminLayout, title: 'Appointments Schedule', btnTheme: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20', lightTheme: 'bg-blue-100 text-blue-700' };
      case 'DOCTOR': return { Layout: DoctorLayout, title: 'Clinic Appointments', btnTheme: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20', lightTheme: 'bg-teal-100 text-teal-700' };
      case 'PATIENT': return { Layout: PatientLayout, title: 'My Appointments', btnTheme: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20', lightTheme: 'bg-emerald-100 text-emerald-700' };
      case 'RECEPTIONIST': return { Layout: ReceptionLayout, title: 'Front Desk Appointments', btnTheme: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20', lightTheme: 'bg-indigo-100 text-indigo-700' };
      default: return { Layout: DashboardLayout, title: 'Appointments Schedule', btnTheme: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20', lightTheme: 'bg-blue-100 text-blue-700' };
    }
  };

  const { Layout, title, btnTheme, lightTheme } = getLayoutDetails();

  return (
    <Layout title={title}>
      {user?.role === 'PATIENT' && (
        <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl mb-6 flex items-start gap-3">
          <div className="mt-0.5"><Calendar size={16} /></div>
          <p><strong>Appointments & Refunds:</strong> You can only cancel a <strong>PENDING</strong> appointment. If you cancel a PAID appointment, the refund is processed automatically. Confirmed appointments cannot be cancelled from the portal.</p>
        </div>
      )}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Calendar className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-lg">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Date & Time</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">
                    {user?.role === 'PATIENT' ? 'Doctor' : 'Patient'}
                  </th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Type</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <Calendar className="w-4 h-4 text-slate-400" />
                         <span className="font-medium text-slate-800">{new Date(apt.appointment_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                         <Clock className="w-4 h-4" />
                         <span>{apt.appointment_time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${lightTheme} flex items-center justify-center font-bold`}>
                           {user?.role === 'PATIENT' ? apt.doctor_first_name.charAt(0) : apt.patient_first_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {user?.role === 'PATIENT' 
                              ? `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name}` 
                              : `${apt.patient_first_name} ${apt.patient_last_name}`}
                          </p>
                          <p className="text-xs text-slate-500">
                             {user?.role === 'PATIENT' ? apt.specialization : `ID: ${apt.patient_reg_id}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 font-medium capitalize">{apt.type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user?.role !== 'PATIENT' && (
                       <>
                          {apt.status === 'PENDING' && (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleStatusUpdate(apt.id, 'CONFIRMED')}
                                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Confirm"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(apt.id, 'CANCELLED')}
                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                          {apt.status === 'CONFIRMED' && (
                             <button 
                               onClick={() => user?.role === 'DOCTOR' ? setReportModalApt(apt) : handleStatusUpdate(apt.id, 'COMPLETED')}
                               className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${btnTheme}`}
                             >
                               {user?.role === 'DOCTOR' ? 'Generate Report & Complete' : 'Mark Completed'}
                             </button>
                          )}
                          {apt.status === 'COMPLETED' && user?.role === 'DOCTOR' && (
                             <button 
                               onClick={() => downloadMedicalCertificate(
                                 { 
                                   name: `${apt.patient_first_name} ${apt.patient_last_name}`, 
                                   age: '___', 
                                   gender: '___' 
                                 },
                                 { 
                                   name: `${apt.doctor_first_name} ${apt.doctor_last_name}`, 
                                   specialization: apt.specialization 
                                 },
                                 { 
                                   diagnosis: apt.symptoms || 'General Checkup', 
                                   restDays: 2 
                                 }
                               )}
                               className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors text-sm flex items-center gap-1 ml-auto"
                             >
                               <Download className="w-4 h-4" /> Medical Cert
                             </button>
                          )}
                        </>
                      )}
                      
                      {user?.role === 'PATIENT' && (
                        <div className="flex justify-end gap-2 items-center">
                           {apt.status === 'PENDING' && (
                              <>
                                <button 
                                  onClick={() => setRescheduleModalApt(apt)}
                                  className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Reschedule"
                                >
                                  <CalendarPlus className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleStatusUpdate(apt.id, 'CANCELLED')}
                                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Cancel"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                           )}
                           {['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED'].includes(apt.status) && (
                               <span className="text-[10px] text-slate-400 font-medium italic px-2">
                                 This appointment can no longer be cancelled.
                               </span>
                           )}
                           {apt.payment_status === 'PAID' && (
                              <button 
                                onClick={() => downloadInvoiceReceipt({
                                  id: apt.invoice_id || apt.payment_reference || apt.id,
                                  payment_method: 'Online payment',
                                  created_at: apt.updated_at,
                                  items: [{ description: 'Consultation Fee', type: 'CONSULTATION', amount: apt.paid_amount || 500 }],
                                  net_amount: apt.paid_amount || 500
                                }, user)}
                                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                                title="Download Receipt"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                           )}
                           {apt.status === 'COMPLETED' && (
                              <button
                                onClick={() => setFeedbackModalApt(apt)}
                                className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1"
                                title="Rate Experience"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                           )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reportModalApt && (
        <ReportModal 
          appointment={reportModalApt} 
          onClose={() => setReportModalApt(null)} 
          onSuccess={() => {
            setReportModalApt(null);
            fetchAppointments();
          }} 
        />
      )}

      {rescheduleModalApt && (
        <RescheduleModal 
          appointment={rescheduleModalApt} 
          onClose={() => setRescheduleModalApt(null)} 
          onSuccess={() => {
            setRescheduleModalApt(null);
            fetchAppointments();
          }} 
        />
      )}

      {feedbackModalApt && (
        <FeedbackModal 
          appointment={feedbackModalApt}
          onClose={() => setFeedbackModalApt(null)}
          onSuccess={() => {
            setFeedbackModalApt(null);
          }}
        />
      )}
    </Layout>
  );
};

export default AppointmentsList;
