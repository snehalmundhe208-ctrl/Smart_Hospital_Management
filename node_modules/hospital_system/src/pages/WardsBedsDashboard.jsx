import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { Bed, Activity, Plus, Pencil, Trash2, X, Check, Save, User, Clock, Stethoscope, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const WardsBedsDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedWard, setSelectedWard] = useState(null);
  
  // Modals state
  const [wardModal, setWardModal] = useState({ open: false, data: null });
  const [bedModal, setBedModal] = useState({ open: false, data: null });
  const [assignModal, setAssignModal] = useState({ open: false, bed: null });
  
  // Forms state
  const [wardForm, setWardForm] = useState({ name: '', type: 'General', capacity: '' });
  const [bedForm, setBedForm] = useState({ bed_number: '' });
  const [assignForm, setAssignForm] = useState({ patient_id: '', admission_date: '', doctor_name: '' });

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  // Queries
  const { data: wards, isLoading: wardsLoading } = useQuery({
    queryKey: ['wards'],
    queryFn: async () => {
      try {
        const res = await axios.get('/api/hospital/wards', getHeaders());
        return res.data;
      } catch { return []; }
    }
  });

  const { data: beds, isLoading: bedsLoading } = useQuery({
    queryKey: ['beds', selectedWard],
    queryFn: async () => {
      if (!selectedWard) return [];
      try {
        const res = await axios.get(`/api/hospital/wards/${selectedWard}/beds`, getHeaders());
        return res.data;
      } catch { return []; }
    },
    enabled: !!selectedWard
  });

  // Mutations - Wards
  const saveWardMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) return axios.put(`/api/hospital/wards/${data.id}`, data, getHeaders());
      return axios.post('/api/hospital/wards', data, getHeaders());
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['wards'] }); 
      setWardModal({ open: false, data: null }); 
      toast.success('Ward saved successfully');
    },
    onError: () => toast.error('Failed to save ward')
  });

  const deleteWardMutation = useMutation({
    mutationFn: async (id) => axios.delete(`/api/hospital/wards/${id}`, getHeaders()),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['wards'] }); 
      setSelectedWard(null); 
      toast.success('Ward deleted successfully');
    },
    onError: () => toast.error('Failed to delete ward')
  });

  // Mutations - Beds
  const saveBedMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, ward_id: selectedWard };
      if (data.id) return axios.put(`/api/hospital/beds/${data.id}`, payload, getHeaders());
      return axios.post('/api/hospital/beds', payload, getHeaders());
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['beds', selectedWard] }); 
      setBedModal({ open: false, data: null }); 
      toast.success('Bed saved successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save bed')
  });

  const deleteBedMutation = useMutation({
    mutationFn: async (id) => axios.delete(`/api/hospital/beds/${id}`, getHeaders()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds', selectedWard] });
      toast.success('Bed deleted successfully');
    },
    onError: () => toast.error('Failed to delete bed')
  });

  const updateBedMutation = useMutation({
    mutationFn: async (data) => {
      return axios.put(`/api/hospital/beds/${data.id}`, data, getHeaders());
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['beds', selectedWard] }); 
      setAssignModal({ open: false, bed: null });
      toast.success('Bed updated successfully');
    },
    onError: () => toast.error('Failed to update bed')
  });

  // Handlers
  const handleSaveWard = (e) => {
    e.preventDefault();
    saveWardMutation.mutate({ ...wardForm, id: wardModal.data?.id });
  };

  const handleSaveBed = (e) => {
    e.preventDefault();
    saveBedMutation.mutate({ ...bedForm, id: bedModal.data?.id });
  };

  const handleAssign = (e) => {
    e.preventDefault();
    updateBedMutation.mutate({ 
      id: assignModal.bed.id, 
      status: 'OCCUPIED', 
      patient_id: assignForm.patient_id,
      admission_date: assignForm.admission_date,
      doctor_name: assignForm.doctor_name
    });
  };

  const handleRelease = (bed) => {
    if (window.confirm(`Release bed ${bed.bed_number}? Patient will be discharged.`)) {
      updateBedMutation.mutate({ id: bed.id, status: 'AVAILABLE', patient_id: null, admission_date: null, doctor_name: null });
    }
  };

  const openWardModal = (ward = null) => {
    setWardForm(ward ? { name: ward.name, type: ward.type, capacity: ward.capacity } : { name: '', type: 'General', capacity: '' });
    setWardModal({ open: true, data: ward });
  };

  const openBedModal = (bed = null) => {
    setBedForm(bed ? { bed_number: bed.bed_number } : { bed_number: '' });
    setBedModal({ open: true, data: bed });
  };

  const openAssignModal = (bed) => {
    setAssignForm({ patient_id: '', admission_date: new Date().toISOString().split('T')[0], doctor_name: '' });
    setAssignModal({ open: true, bed });
  };

  return (
    <div className="p-6 md:p-8 bg-transparent min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Ward Management</h1>
          <p className="text-slate-500 mt-1">Manage wards, beds, and patient allocations</p>
        </div>
        <div className="flex gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 text-slate-800 px-5 py-3 rounded-2xl shadow-sm flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Activity className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Wards</p>
                <p className="text-xl font-bold text-slate-800 leading-none mt-1">{wards?.length || 0}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Wards List Sidebar */}
        <div className="xl:col-span-1 flex flex-col h-[calc(100vh-12rem)]">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 text-slate-800 p-5 flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6 px-2">
              <h2 className="text-xl font-extrabold text-slate-800">Wards</h2>
              <button onClick={() => openWardModal()} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors" title="Add Ward">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {wardsLoading ? (
                 <div className="animate-pulse space-y-3">
                   {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl w-full" />)}
                 </div>
              ) : wards?.length === 0 ? (
                 <div className="text-center p-6 bg-black/30 rounded-2xl border border-slate-200 border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">No wards found</p>
                 </div>
              ) : (
                wards?.map((ward) => (
                  <motion.div
                    key={ward.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedWard(ward.id)}
                    className={`group cursor-pointer p-4 rounded-2xl transition-all border ${
                      selectedWard === ward.id ? 'bg-indigo-600 border-indigo-600 text-slate-800 shadow-md shadow-indigo-500/20' : 'bg-white/50 hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-lg">{ward.name}</div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openWardModal(ward); }} className={`p-1.5 rounded-lg ${selectedWard === ward.id ? 'hover:bg-white/20' : 'hover:bg-slate-700'}`}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete ward?')) deleteWardMutation.mutate(ward.id); }} className={`p-1.5 rounded-lg ${selectedWard === ward.id ? 'hover:bg-red-500/50' : 'hover:bg-red-100 text-red-600'}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className={`text-sm font-medium flex justify-between items-center ${selectedWard === ward.id ? 'text-indigo-700' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1.5"><Activity className="w-4 h-4" /> {ward.type}</span>
                      <span>Capacity: {ward.capacity}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Beds Grid Area */}
        <div className="xl:col-span-3 flex flex-col h-[calc(100vh-12rem)]">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 text-slate-800 p-6 md:p-8 flex-1 flex flex-col overflow-hidden relative">
            {!selectedWard ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                   <Bed className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-600">No Ward Selected</h3>
                <p className="mt-2 text-center max-w-sm">Select a ward from the list to view and manage its beds and patient allocations.</p>
              </div>
            ) : bedsLoading ? (
               <div className="flex-1 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
               </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Bed className="w-6 h-6" /></div>
                      Bed Allocation
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Manage beds in {wards?.find(w => w.id === selectedWard)?.name}</p>
                  </div>
                  <button onClick={() => openBedModal()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Bed
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {beds?.map((bed) => {
                      const isAvail = bed.status === 'AVAILABLE';
                      const isOcc = bed.status === 'OCCUPIED';
                      
                      return (
                        <motion.div
                          key={bed.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`group relative rounded-3xl p-5 border-2 transition-all flex flex-col bg-white
                            ${isAvail ? 'border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-emerald-500/10' : 
                              isOcc ? 'border-rose-100 hover:border-rose-300 shadow-sm hover:shadow-rose-500/10' : 
                              'border-amber-100 hover:border-amber-300 shadow-sm hover:shadow-amber-500/10'
                            }`}
                        >
                          {/* Bed Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-2xl ${isAvail ? 'bg-emerald-50 text-emerald-600' : isOcc ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                <Bed className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="font-extrabold text-lg text-slate-800">{bed.bed_number}</h3>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isAvail ? 'bg-emerald-100 text-emerald-700' : isOcc ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {bed.status}
                                </span>
                              </div>
                            </div>
                            
                            {/* Bed Actions (Edit/Delete) */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-slate-100 p-1 transition-opacity">
                               <button onClick={() => openBedModal(bed)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"><Pencil className="w-4 h-4" /></button>
                               <button onClick={() => { if(window.confirm('Delete bed?')) deleteBedMutation.mutate(bed.id); }} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>

                          {/* Bed Details */}
                          <div className="flex-1 min-h-[5rem] flex flex-col justify-center">
                            {isOcc ? (
                              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-slate-500" />
                                  <span className="font-bold text-slate-800 text-sm truncate">{bed.first_name} {bed.last_name || bed.patient_id}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {bed.admission_date || 'N/A'}</span>
                                  <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> {bed.doctor_name || 'Assigned'}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full text-slate-500 gap-2 font-medium">
                                <Check className="w-5 h-5 text-emerald-500" /> Ready for Admission
                              </div>
                            )}
                          </div>

                          {/* Primary Action Button */}
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            {isAvail ? (
                              <button onClick={() => openAssignModal(bed)} className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Assign Patient
                              </button>
                            ) : (
                              <button onClick={() => handleRelease(bed)} className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Check className="w-4 h-4" /> Release Bed
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  {beds?.length === 0 && (
                     <div className="text-center p-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 mt-4">
                        <Bed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-600 mb-1">No Beds Created</h3>
                        <p className="text-slate-500 mb-4">This ward currently has no beds assigned.</p>
                        <button onClick={() => openBedModal()} className="px-6 py-2.5 bg-white/90 backdrop-blur-xl border border-slate-200 text-slate-800 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors">Add First Bed</button>
                     </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ward Form Modal */}
      <AnimatePresence>
        {wardModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">{wardModal.data ? 'Edit Ward' : 'Add New Ward'}</h3>
                <button onClick={() => setWardModal({ open: false, data: null })} className="p-2 hover:bg-slate-700 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveWard} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Ward Name</label>
                  <input required type="text" value={wardForm.name} onChange={e => setWardForm({...wardForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. ICU-A" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Ward Type</label>
                  <select required value={wardForm.type} onChange={e => setWardForm({...wardForm, type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <option value="General">General Ward</option>
                    <option value="ICU">Intensive Care Unit (ICU)</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Pediatric">Pediatric</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Capacity (Total Beds)</label>
                  <input required type="number" min="1" value={wardForm.capacity} onChange={e => setWardForm({...wardForm, capacity: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. 20" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setWardModal({ open: false, data: null })} className="flex-1 py-3 px-4 bg-white/90 backdrop-blur-xl border border-slate-200 text-slate-800 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={saveWardMutation.isPending} className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
                    <Save className="w-4 h-4" /> Save Ward
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bed Form Modal */}
      <AnimatePresence>
        {bedModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">{bedModal.data ? 'Edit Bed' : 'Add New Bed'}</h3>
                <button onClick={() => setBedModal({ open: false, data: null })} className="p-2 hover:bg-slate-700 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveBed} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Bed Number / Identifier</label>
                  <input required type="text" value={bedForm.bed_number} onChange={e => setBedForm({...bedForm, bed_number: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-lg" placeholder="e.g. B-01" />
                </div>
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setBedModal({ open: false, data: null })} className="flex-1 py-3 px-4 bg-white/90 backdrop-blur-xl border border-slate-200 text-slate-800 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={saveBedMutation.isPending} className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">
                    Save Bed
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Patient Modal */}
      <AnimatePresence>
        {assignModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Assign Patient to Bed</h3>
                  <p className="text-emerald-100 text-sm mt-0.5">Bed: <span className="font-bold">{assignModal.bed?.bed_number}</span></p>
                </div>
                <button onClick={() => setAssignModal({ open: false, bed: null })} className="p-2 bg-emerald-500/50 hover:bg-emerald-500 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAssign} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Patient ID (UUID)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input required type="text" value={assignForm.patient_id} onChange={e => setAssignForm({...assignForm, patient_id: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Enter patient ID..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Admission Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input required type="date" value={assignForm.admission_date} onChange={e => setAssignForm({...assignForm, admission_date: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Attending Doctor</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input required type="text" value={assignForm.doctor_name} onChange={e => setAssignForm({...assignForm, doctor_name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Dr. Name..." />
                  </div>
                </div>
                
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3 mt-2">
                   <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                   <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                     Confirming this will mark the bed as occupied and register the admission date. Ensure patient ID is correct.
                   </p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setAssignModal({ open: false, bed: null })} className="flex-1 py-3 px-4 bg-white/90 backdrop-blur-xl border border-slate-200 text-slate-800 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={updateBedMutation.isPending} className="flex-1 py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2">
                    <Check className="w-5 h-5" /> Confirm Admission
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WardsBedsDashboard;


