import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Search, UserPlus, Eye, Download, FileText, Stethoscope, FlaskConical, ReceiptText, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadInvoiceReceipt, downloadMedicalReport, exportToCSV, exportToPDF } from '../utils/exportUtils';
import ProfileAvatar from '../components/ProfileAvatar';

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const { data } = await axios.get('/api/patients', config);
        setPatients(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = patients.filter(p =>
    `${p.first_name} ${p.last_name} ${p.patient_id}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const data = filtered.map(p => ({
      ID: p.patient_id,
      'First Name': p.first_name,
      'Last Name': p.last_name,
      Email: p.email,
      Phone: p.phone,
      'Blood Group': p.blood_group,
      Allergies: p.allergies
    }));
    exportToCSV(data, 'patients_report');
  };

  const handleExportPDF = () => {
    const columns = ['ID', 'Name', 'Email', 'Phone', 'Blood Group', 'Allergies'];
    const data = filtered.map(p => [
      p.patient_id,
      `${p.first_name} ${p.last_name}`,
      p.email,
      p.phone || '-',
      p.blood_group || '-',
      p.allergies || 'None'
    ]);
    exportToPDF('Patients Report', columns, data, 'patients_report');
  };

  const handleViewPatient = async (patient) => {
    setSelectedPatient(patient);
    setLoadingHistory(true);
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.get(`/api/patients/${patient.id}`, config);
      setSelectedPatient(data);
    } catch (error) {
      console.error('Unable to load patient history', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <AdminLayout title="Patient Management">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or patient ID..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white shadow-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExportCSV}
            className="p-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
            <Download className="w-5 h-5" /> <span className="hidden sm:inline">CSV</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExportPDF}
            className="p-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-500" /> <span className="hidden sm:inline">PDF</span>
          </motion.button>
          <Link to="/register">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-primary-600 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-primary-500/30 flex items-center gap-2 hover:bg-primary-700 transition-colors whitespace-nowrap">
              <UserPlus className="w-5 h-5" /> Add Patient
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Patient</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">ID</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Blood Group</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Phone</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Allergies</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p, idx) => (
                  <motion.tr key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar user={p} className="w-10 h-10" fallbackClassName="bg-primary-600 text-white text-sm" />
                        <div>
                          <p className="font-bold text-slate-800">{p.first_name} {p.last_name}</p>
                          <p className="text-xs text-slate-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-primary-50 text-primary-700 font-mono text-xs font-bold px-2 py-1 rounded-lg">
                        {p.patient_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        p.blood_group ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'
                      }`}>{p.blood_group || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{p.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-[160px] truncate">{p.allergies || 'None'}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleViewPatient(p)}
                        className="p-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors shadow-sm hover:shadow"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-40 text-slate-500">No patients found.</div>
            )}
          </div>
        )}
      </div>

      {/* View Patient Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-100"
          >
            <div className="bg-gradient-to-r from-primary-600 to-primary-400 p-6 text-white flex justify-between items-start">
              <div className="flex items-center gap-4">
                <ProfileAvatar user={selectedPatient} className="w-16 h-16 rounded-2xl border border-white/30 shadow-inner" fallbackClassName="bg-white/20 text-white text-2xl" />
                <div>
                  <h3 className="font-bold text-xl text-white">{selectedPatient.first_name} {selectedPatient.last_name}</h3>
                  <p className="text-primary-100 font-mono text-sm">{selectedPatient.patient_id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-sm font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-slate-400 mb-1">Blood Group</p>
                  <p className="text-red-600 font-bold text-lg">{selectedPatient.blood_group || 'Unknown'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-slate-400 mb-1">Date of Birth</p>
                  <p className="text-slate-800 text-lg">{new Date(selectedPatient.dob).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-800">{selectedPatient.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Phone</span>
                  <span className="text-slate-800">{selectedPatient.phone || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Gender</span>
                  <span className="text-slate-800">{selectedPatient.gender}</span>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <p className="text-red-400 mb-1">Allergies</p>
                  <p className="text-red-700 font-bold">{selectedPatient.allergies || 'None recorded'}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-orange-400 mb-1">Chronic Diseases</p>
                  <p className="text-orange-700 font-bold">{selectedPatient.chronic_diseases || 'None recorded'}</p>
              </div>

              <section className="border-t border-slate-100 pt-5">
                <div className="mb-3 flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary-600" /><h4 className="font-extrabold text-slate-800">Complete Medical History</h4></div>
                {loadingHistory ? <div className="flex h-24 items-center justify-center text-slate-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Loading medical history…</div> : <div className="space-y-3 max-h-48 overflow-y-auto pr-1">{selectedPatient.medical_history?.appointments?.length ? selectedPatient.medical_history.appointments.map((appointment) => <div key={appointment.id} className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-slate-800">Dr. {appointment.doctor_first_name} {appointment.doctor_last_name} <span className="ml-2 text-xs font-medium text-slate-500">{appointment.specialization}</span></p><p className="mt-1 text-xs text-slate-500">{new Date(appointment.appointment_date).toLocaleDateString()} · {appointment.appointment_time} · {appointment.status}</p><p className="mt-1 text-sm text-slate-600">{appointment.symptoms || 'No symptoms recorded'}</p></div>) : <p className="text-sm text-slate-500">No appointment history recorded.</p>}</div>}
              </section>

              <section className="border-t border-slate-100 pt-5">
                <div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-emerald-600" /><h4 className="font-extrabold text-slate-800">Clinical Reports & Prescriptions</h4></div>
                <div className="space-y-3">{selectedPatient.medical_history?.reports?.length ? selectedPatient.medical_history.reports.map((report) => <div key={report.id} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-slate-800">{report.diagnosis}</p><p className="mt-1 text-xs text-slate-500">{report.report_number || 'Clinical report'} · Dr. {report.doctor_first_name} {report.doctor_last_name}</p><p className="mt-2 text-sm text-slate-600">{report.medical_findings || report.notes || 'No findings recorded'}</p></div><button onClick={() => downloadMedicalReport(report, selectedPatient, selectedPatient.medical_history?.lab_reports || [])} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-100"><Download className="h-3.5 w-3.5" /> Download report</button></div></div>) : <p className="text-sm text-slate-500">No clinical reports recorded.</p>}</div>
              </section>

              <section className="grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
                <div><div className="mb-2 flex items-center gap-2"><FlaskConical className="h-4 w-4 text-purple-600" /><h4 className="font-extrabold text-slate-800">Lab Reports</h4></div>{selectedPatient.medical_history?.lab_reports?.length ? selectedPatient.medical_history.lab_reports.map((report) => <p key={report.id} className="rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-900">{report.test_name} <span className="float-right text-xs font-bold">{report.status}</span></p>) : <p className="text-sm text-slate-500">No lab reports.</p>}</div>
                <div><div className="mb-2 flex items-center gap-2"><ReceiptText className="h-4 w-4 text-amber-600" /><h4 className="font-extrabold text-slate-800">Receipts</h4></div>{selectedPatient.medical_history?.invoices?.length ? selectedPatient.medical_history.invoices.map((invoice) => <button key={invoice.id} onClick={() => downloadInvoiceReceipt(invoice, selectedPatient)} className="mb-2 flex w-full items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-left text-sm text-amber-900 hover:bg-amber-100"><span>Receipt #{invoice.id.slice(0, 8)}</span><Download className="h-4 w-4" /></button>) : <p className="text-sm text-slate-500">No receipts.</p>}</div>
              </section>

              <div className="pt-4 flex gap-3">
                <button onClick={() => setSelectedPatient(null)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminPatients;

