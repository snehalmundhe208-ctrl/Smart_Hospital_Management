import React, { useState } from 'react';
import axios from '../api/axios';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const RescheduleModal = ({ appointment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    appointment_date: '',
    appointment_time: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put(`/api/appointments/${appointment.id}/reschedule`, formData, config);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <h3 className="font-bold text-xl">Reschedule Appointment</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white p-2 bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
             <p className="text-sm text-slate-500 mb-1">Current Appointment</p>
             <p className="font-bold text-slate-800">{new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}</p>
             <p className="text-sm text-slate-600 mt-1">Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}</p>
          </div>

          <form id="reschedule-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">New Date *</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-slate-400" />
                 </div>
                 <input 
                   required 
                   type="date" 
                   min={new Date().toISOString().split('T')[0]}
                   value={formData.appointment_date} 
                   onChange={e => setFormData({...formData, appointment_date: e.target.value})} 
                   className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" 
                 />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">New Time *</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-slate-400" />
                 </div>
                 <input 
                   required 
                   type="time" 
                   value={formData.appointment_time} 
                   onChange={e => setFormData({...formData, appointment_time: e.target.value})} 
                   className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" 
                 />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" form="reschedule-form" disabled={loading} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RescheduleModal;
