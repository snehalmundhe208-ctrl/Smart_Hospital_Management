import React, { useState } from 'react';
import axios from '../api/axios';
import { X, Plus, Trash2, FileText, CheckCircle, FileBadge } from 'lucide-react';
import { motion } from 'framer-motion';

const ReportModal = ({ appointment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    diagnosis: '',
    notes: '',
    medical_findings: '',
    conclusion: '',
    follow_up_date: '',
    items: [],
    requires_certificate: false,
    rest_days: 0
  });
  const [medicineInput, setMedicineInput] = useState({ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' });
  const [loading, setLoading] = useState(false);

  const handleAddMedicine = () => {
    if (!medicineInput.medicine_name || !medicineInput.dosage) return;
    setFormData({ ...formData, items: [...formData.items, medicineInput] });
    setMedicineInput({ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' });
  };

  const handleRemoveMedicine = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      
      // 1. Create Prescription / Report
      await axios.post('/api/prescriptions', {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        ...formData
      }, config);

      // 2. Mark Appointment as Completed
      await axios.put(`/api/appointments/${appointment.id}/status`, { status: 'COMPLETED' }, config);

      onSuccess();
    } catch (error) {
      console.error('Error generating report:', error.response?.data || error.message || error);
      let errMsg = 'Failed to generate report. Please try again.';
      if (error.response?.data?.message) {
         errMsg = error.response.data.message;
      } else if (error.message) {
         errMsg = error.message;
      }
      alert(`Error: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-teal-600 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <h3 className="font-bold text-xl">Generate Medical Report</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-2 bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500">Patient</p>
              <p className="font-bold text-slate-800">{appointment.patient_first_name} {appointment.patient_last_name}</p>
            </div>
            <div>
               <p className="text-sm text-slate-500">Appointment Symptoms</p>
               <p className="font-medium text-slate-800">{appointment.symptoms || 'None recorded'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Date</p>
              <p className="font-medium text-slate-800">{new Date(appointment.appointment_date).toLocaleDateString()}</p>
            </div>
          </div>

          <form id="report-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Diagnosis *</label>
                <input required type="text" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" placeholder="e.g. Acute Bronchitis" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Follow-up Date</label>
                <input type="date" value={formData.follow_up_date} onChange={e => setFormData({...formData, follow_up_date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 my-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-100 p-2 rounded-lg text-teal-600">
                    <FileBadge className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Medical Certificate Required?</h4>
                    <p className="text-xs text-slate-500">Generate an official certificate for the patient to download.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={formData.requires_certificate} onChange={e => setFormData({...formData, requires_certificate: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
              {formData.requires_certificate && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Recommended Rest Days</label>
                  <input type="number" min="0" value={formData.rest_days} onChange={e => setFormData({...formData, rest_days: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white" placeholder="e.g. 3" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Medical Findings / Test Results</label>
              <textarea value={formData.medical_findings} onChange={e => setFormData({...formData, medical_findings: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 h-24" placeholder="Detailed observations from examination..."></textarea>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Conclusion</label>
                  <textarea value={formData.conclusion} onChange={e => setFormData({...formData, conclusion: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 h-24" placeholder="Final summary..."></textarea>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 h-24" placeholder="Advice, diet recommendations..."></textarea>
               </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
               <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-teal-600"/> Prescribe Medicines</h4>
               
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4 mb-4">
                  <div className="grid md:grid-cols-5 gap-3">
                     <input type="text" placeholder="Medicine Name *" value={medicineInput.medicine_name} onChange={e => setMedicineInput({...medicineInput, medicine_name: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm md:col-span-2" />
                     <input type="text" placeholder="Dosage (e.g. 500mg) *" value={medicineInput.dosage} onChange={e => setMedicineInput({...medicineInput, dosage: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                     <input type="text" placeholder="Frequency (e.g. 1-0-1)" value={medicineInput.frequency} onChange={e => setMedicineInput({...medicineInput, frequency: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                     <input type="text" placeholder="Duration (e.g. 5 Days)" value={medicineInput.duration} onChange={e => setMedicineInput({...medicineInput, duration: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="flex gap-3 items-center">
                     <input type="text" placeholder="Instructions (e.g. After food)" value={medicineInput.instructions} onChange={e => setMedicineInput({...medicineInput, instructions: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm flex-1" />
                     <button type="button" onClick={handleAddMedicine} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-teal-700 transition-colors whitespace-nowrap">
                        <Plus className="w-4 h-4" /> Add
                     </button>
                  </div>
               </div>

               {formData.items.length > 0 && (
                 <div className="border border-slate-200 rounded-xl overflow-hidden">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 border-b border-slate-200">
                       <tr>
                         <th className="p-3 font-semibold text-slate-600">Medicine</th>
                         <th className="p-3 font-semibold text-slate-600">Dosage</th>
                         <th className="p-3 font-semibold text-slate-600">Freq.</th>
                         <th className="p-3 font-semibold text-slate-600">Duration</th>
                         <th className="p-3 font-semibold text-slate-600 w-10"></th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {formData.items.map((item, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="p-3 font-medium text-slate-800">{item.medicine_name}</td>
                            <td className="p-3 text-slate-600">{item.dosage}</td>
                            <td className="p-3 text-slate-600">{item.frequency}</td>
                            <td className="p-3 text-slate-600">{item.duration}</td>
                            <td className="p-3 text-right">
                              <button type="button" onClick={() => handleRemoveMedicine(idx)} className="text-red-500 hover:text-red-700 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" form="report-form" disabled={loading || !formData.diagnosis} className="px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? 'Saving...' : 'Generate & Complete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportModal;




