import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Pencil, Trash2, X, Save, Clock, Calendar as CalendarIcon, Phone, Mail, Award, Briefcase, GraduationCap } from 'lucide-react';
import ProfileAvatar from '../components/ProfileAvatar';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', specialization: '', degree: '',
    department_id: '', experience_years: '', consultation_fee: '', 
    available_days: 'Mon,Tue,Wed,Thu,Fri', shift_start: '09:00', shift_end: '17:00'
  });
  const [notice, setNotice] = useState('');

  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [docsRes, deptsRes] = await Promise.all([
           axios.get('/api/doctors', config),
           axios.get('/api/departments')
        ]);
        setDoctors(docsRes.data);
        setDepartments(deptsRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const openForm = (doc = null) => {
    if (doc) {
      setFormData({
        first_name: doc.first_name || '', last_name: doc.last_name || '', 
        email: doc.email || '', phone: doc.phone || '', 
        specialization: doc.specialization || '', degree: doc.degree || '', department_id: doc.department_id || '', 
        experience_years: doc.experience_years || '', consultation_fee: doc.consultation_fee || '', 
        available_days: doc.available_days || 'Mon,Tue,Wed,Thu,Fri', 
        shift_start: doc.shift_start ? doc.shift_start.slice(0, 5) : '09:00', 
        shift_end: doc.shift_end ? doc.shift_end.slice(0, 5) : '17:00'
      });
      setSelectedDoctor(doc);
    } else {
      setFormData({
        first_name: '', last_name: '', email: '', phone: '', specialization: '', degree: '',
        department_id: '', experience_years: '', consultation_fee: '', 
        available_days: 'Mon,Tue,Wed,Thu,Fri', shift_start: '09:00', shift_end: '17:00'
      });
      setSelectedDoctor(null);
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      if (selectedDoctor) {
        const { data } = await axios.put(`/api/doctors/${selectedDoctor.id}`, formData, config);
        setDoctors(docs => docs.map(d => d.id === data.id ? { ...d, ...data, department_name: departments.find(dp => dp.id == data.department_id)?.name } : d));
        setNotice('Doctor updated successfully');
      } else {
        const { data } = await axios.post('/api/doctors', formData, config);
        setDoctors(docs => [...docs, { ...data.doctor, department_name: departments.find(dp => dp.id == data.doctor.department_id)?.name }]);
        setNotice('Doctor created successfully. Default password is password123');
      }
      setIsFormOpen(false);
      setSelectedDoctor(null);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Error saving doctor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor? This will remove their user account as well.')) return;
    try {
      await axios.delete(`/api/doctors/${id}`, config);
      setDoctors(docs => docs.filter(d => d.id !== id));
      setSelectedDoctor(null);
    } catch (error) {
      alert('Failed to delete doctor');
    }
  };

  const filtered = doctors.filter(d =>
    `${d.first_name || ''} ${d.last_name || ''} ${d.specialization || ''} ${d.degree || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Doctor Management">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, specialization, degree..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-primary-500 bg-white shadow-sm transition-all text-slate-700"
          />
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openForm(null)} 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-3.5 rounded-2xl font-bold hover:shadow-lg hover:shadow-primary-500/30 transition-all whitespace-nowrap"
        >
           <Plus className="w-5 h-5" /> Add Doctor
        </motion.button>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-4 rounded-2xl border border-green-200 bg-green-50/50 backdrop-blur-sm text-green-700 font-bold flex justify-between items-center shadow-sm"
          >
             {notice}
             <button onClick={() => setNotice('')} className="p-1 hover:bg-green-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((doc, idx) => (
            <motion.div key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -6, scale: 1.01 }}
              onClick={() => setSelectedDoctor(doc)}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 hover:border-primary-100 transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-50 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform group-hover:scale-110" />
              
              <div className="flex items-start gap-4 mb-6 relative z-10">
                <ProfileAvatar user={doc} className="w-16 h-16 rounded-2xl shadow-md" fallbackClassName="bg-gradient-to-br from-primary-600 to-primary-400 text-white text-xl font-bold" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-slate-800 text-lg truncate" title={`Dr. ${doc.first_name} ${doc.last_name}`}>
                    Dr. {doc.first_name} {doc.last_name}
                  </h3>
                  <p className="text-sm text-primary-600 font-semibold truncate flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> {doc.specialization}
                  </p>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <GraduationCap className="w-3.5 h-3.5" /> {doc.degree || 'MBBS'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm flex-1 relative z-10">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100/50">
                  <span className="text-slate-500 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Dept</span>
                  <span className="font-semibold text-slate-700">{doc.department_name || '—'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100/50">
                  <span className="text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Exp</span>
                  <span className="font-semibold text-slate-700">{doc.experience_years} yrs</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100/50">
                  <span className="text-slate-500 flex items-center gap-2">Fee</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">₹{doc.consultation_fee}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Doctor Details Modal */}
      <AnimatePresence>
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20"
          >
            <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-5">
                  <ProfileAvatar user={selectedDoctor} className="w-20 h-20 rounded-2xl border-2 border-white/30 shadow-xl" fallbackClassName="bg-white/20 text-white text-3xl font-bold backdrop-blur-sm" />
                  <div>
                    <h3 className="font-extrabold text-2xl text-white tracking-tight">Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</h3>
                    <p className="text-primary-100 font-medium flex items-center gap-1.5 mt-1">
                       <Award className="w-4 h-4" /> {selectedDoctor.specialization}
                    </p>
                    <p className="text-white/80 text-sm flex items-center gap-1.5 mt-1">
                       <GraduationCap className="w-4 h-4" /> {selectedDoctor.degree || 'MBBS, MD'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedDoctor(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all backdrop-blur-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl"><Briefcase className="w-5 h-5" /></div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Department</p>
                    <p className="text-slate-800 font-bold">{selectedDoctor.department_name || '—'}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl"><Clock className="w-5 h-5" /></div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Experience</p>
                    <p className="text-slate-800 font-bold">{selectedDoctor.experience_years} Years</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-1 divide-y divide-slate-100">
                <div className="flex items-center gap-3 p-4">
                   <Phone className="w-5 h-5 text-slate-400" />
                   <div className="flex-1">
                      <p className="text-slate-400 text-xs font-semibold">Phone Number</p>
                      <p className="text-slate-700 font-medium">{selectedDoctor.phone || 'N/A'}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 p-4">
                   <Mail className="w-5 h-5 text-slate-400" />
                   <div className="flex-1">
                      <p className="text-slate-400 text-xs font-semibold">Email Address</p>
                      <p className="text-slate-700 font-medium">{selectedDoctor.email}</p>
                   </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> Available Days</span>
                  <span className="text-slate-800 font-semibold bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{selectedDoctor.available_days || 'Mon-Fri'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium flex items-center gap-2"><Clock className="w-4 h-4" /> Shift Timings</span>
                  <span className="text-slate-800 font-semibold">{selectedDoctor.shift_start?.slice(0,5)} - {selectedDoctor.shift_end?.slice(0,5)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Consultation Fee</span>
                  <span className="font-extrabold text-emerald-600 text-xl">₹{selectedDoctor.consultation_fee}</span>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button onClick={() => openForm(selectedDoctor)} className="flex-1 py-3.5 bg-blue-50 text-blue-700 rounded-2xl font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <Pencil className="w-4 h-4" /> Edit Profile
                </button>
                <button onClick={() => handleDelete(selectedDoctor.id)} className="flex-1 py-3.5 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Add/Edit Doctor Form */}
      <AnimatePresence>
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 sm:p-6 backdrop-blur-md overflow-y-auto">
          <motion.form 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            onSubmit={handleSave} 
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden my-auto border border-white/20"
          >
            <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-6 sm:p-8 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{selectedDoctor ? 'Update Doctor Profile' : 'Register New Doctor'}</h2>
                <p className="text-slate-500 text-sm mt-1">Fill in the professional and contact details.</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50 p-2.5 rounded-full border border-slate-200 transition-all shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">First Name</label>
                  <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all text-slate-700 font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Last Name</label>
                  <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all text-slate-700 font-medium" />
                </div>
                {!selectedDoctor && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Email Address (Used for Login)</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all text-slate-700 font-medium" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Phone Number</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all text-slate-700 font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Degree</label>
                  <input required type="text" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} placeholder="e.g. MBBS, MD" className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all text-slate-700 font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Department</label>
                  <select required value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all text-slate-700 font-medium cursor-pointer">
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Specialization</label>
                  <input required type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} placeholder="e.g. Cardiologist" className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all text-slate-700 font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Experience (Years)</label>
                  <input required type="number" min="0" value={formData.experience_years} onChange={e => setFormData({...formData, experience_years: e.target.value})} className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all text-slate-700 font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Consultation Fee (₹)</label>
                  <input required type="number" min="0" value={formData.consultation_fee} onChange={e => setFormData({...formData, consultation_fee: e.target.value})} className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all text-slate-700 font-medium text-emerald-700" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Available Days</label>
                  <input required type="text" value={formData.available_days} onChange={e => setFormData({...formData, available_days: e.target.value})} placeholder="Mon,Tue,Wed,Thu,Fri,Sat,Sun" className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all text-slate-700 font-medium" />
                  <p className="text-xs text-slate-400 mt-1">Comma-separated days (e.g., Mon,Tue,Wed)</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Shift Start</label>
                  <input required type="time" value={formData.shift_start} onChange={e => setFormData({...formData, shift_start: e.target.value})} className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all text-slate-700 font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Shift End</label>
                  <input required type="time" value={formData.shift_end} onChange={e => setFormData({...formData, shift_end: e.target.value})} className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all text-slate-700 font-medium" />
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 hover:shadow-sm transition-all">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0">
                <Save className="w-5 h-5" /> {saving ? 'Saving Profile...' : 'Save Doctor Profile'}
              </button>
            </div>
          </motion.form>
        </div>
      )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminDoctors;
