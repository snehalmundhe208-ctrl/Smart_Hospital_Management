import React, { useState, useEffect } from 'react';
import ReceptionLayout from '../layouts/ReceptionLayout';
import axios from 'axios';
import { Calendar, Users, FileText, CheckCircle, Search, Plus, Clock, ArrowRight, UserCheck, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProfileAvatar from '../components/ProfileAvatar';
import RefundList from '../components/RefundList';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CHART_COLORS = { 'PENDING': '#f59e0b', 'CONFIRMED': '#3b82f6', 'CHECKED_IN': '#6366f1', 'IN_CONSULTATION': '#a855f7', 'COMPLETED': '#10b981' };

const ReceptionDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWalkIns();
    const interval = setInterval(fetchWalkIns, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchWalkIns = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.get('/api/appointments', config);
      // Show all active queue appointments
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    // Optimistic UI update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put(`/api/appointments/${id}/status`, { status }, config);
      // No need to fetch again immediately if optimistic update is successful
    } catch (error) {
      console.error('Error updating status', error);
      fetchWalkIns(); // Revert on failure
    }
  };

  const filteredAppointments = appointments.filter(apt => 
    `${apt.patient_first_name} ${apt.patient_last_name} ${apt.patient_reg_id}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { id: 'PENDING', title: 'Waiting', icon: Clock, color: 'amber', action: 'Confirm', nextStatus: 'CONFIRMED' },
    { id: 'CONFIRMED', title: 'Confirmed', icon: Calendar, color: 'blue', action: 'Check In', nextStatus: 'CHECKED_IN' },
    { id: 'CHECKED_IN', title: 'Checked In', icon: UserCheck, color: 'indigo', action: 'Consulting', nextStatus: 'IN_CONSULTATION' },
    { id: 'IN_CONSULTATION', title: 'In Consultation', icon: Stethoscope, color: 'purple', action: 'Complete', nextStatus: 'COMPLETED' },
    { id: 'COMPLETED', title: 'Completed', icon: CheckCircle, color: 'emerald', action: null, nextStatus: null }
  ];

  const statCards = [
    { title: 'Total Walk-ins Today', value: appointments.length, icon: Users, bg: 'bg-gradient-to-br from-slate-500 to-slate-600' },
    { title: 'Waiting', value: appointments.filter(a => a.status === 'PENDING').length, icon: Clock, bg: 'bg-gradient-to-br from-amber-500 to-amber-600' },
    { title: 'Checked In', value: appointments.filter(a => a.status === 'CHECKED_IN').length, icon: UserCheck, bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
    { title: 'In Consultation', value: appointments.filter(a => a.status === 'IN_CONSULTATION').length, icon: Stethoscope, bg: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { title: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length, icon: CheckCircle, bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
  ];

  const getColorClasses = (color) => {
    const classes = {
      amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', btn: 'bg-amber-100 hover:bg-amber-200 text-amber-700', icon: 'text-amber-500' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', btn: 'bg-blue-100 hover:bg-blue-200 text-blue-700', icon: 'text-blue-500' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', btn: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700', icon: 'text-indigo-500' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', btn: 'bg-purple-100 hover:bg-purple-200 text-purple-700', icon: 'text-purple-500' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', btn: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700', icon: 'text-emerald-500' }
    };
    return classes[color];
  };

  return (
    <ReceptionLayout title="Front Desk Command">
      {loading ? (
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div className="relative w-full max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-0 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-all"
                      placeholder="Search patient by ID or Name..."
                  />
             </div>
             <Link to="/register" className="w-full sm:w-auto">
               <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-indigo-500/40 transition-all whitespace-nowrap"
               >
                  <Plus className="w-5 h-5" /> Register Patient
               </motion.button>
             </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {statCards.map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 relative overflow-hidden group"
              >
                <div className={`absolute -right-6 -top-6 w-24 h-24 ${stat.bg} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500`} />
                <div className={`w-16 h-16 rounded-2xl ${stat.bg} text-white flex items-center justify-center shadow-md relative z-10`}>
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-bold text-slate-500 mb-0.5 uppercase tracking-wide">{stat.title}</p>
                  <h3 className="text-3xl font-extrabold text-slate-800">{stat.value}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Queue Status Chart */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
             <h3 className="text-xl font-bold text-slate-800 mb-6">Live Queue Distribution</h3>
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={[
                         { name: 'Waiting', value: appointments.filter(a => a.status === 'PENDING').length, fill: CHART_COLORS.PENDING },
                         { name: 'Confirmed', value: appointments.filter(a => a.status === 'CONFIRMED').length, fill: CHART_COLORS.CONFIRMED },
                         { name: 'Checked In', value: appointments.filter(a => a.status === 'CHECKED_IN').length, fill: CHART_COLORS.CHECKED_IN },
                         { name: 'In Consultation', value: appointments.filter(a => a.status === 'IN_CONSULTATION').length, fill: CHART_COLORS.IN_CONSULTATION },
                         { name: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length, fill: CHART_COLORS.COMPLETED }
                       ].filter(d => d.value > 0)}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                       nameKey="name"
                       stroke="none"
                     >
                       { /* Cells are handled by fill in data array */ }
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                     <Legend verticalAlign="bottom" height={36} />
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="pt-2">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
              Appointment Queue
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start flex-nowrap overflow-x-auto pb-4 custom-scrollbar">
              {columns.map(col => {
                const colAppointments = filteredAppointments.filter(a => a.status === col.id);
                const styles = getColorClasses(col.color);
                
                return (
                  <div key={col.id} className={`bg-white rounded-[2rem] border-2 border-slate-100 flex flex-col h-[calc(100vh-32rem)] min-h-[500px] min-w-[280px] overflow-hidden`}>
                    <div className={`p-4 border-b-2 border-slate-100 flex justify-between items-center ${styles.bg}`}>
                      <div className="flex items-center gap-2">
                        <col.icon className={`w-5 h-5 ${styles.icon}`} />
                        <h3 className={`font-bold ${styles.text}`}>{col.title}</h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold bg-white ${styles.text} shadow-sm border border-slate-200`}>
                        {colAppointments.length}
                      </span>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4 bg-slate-50/30">
                      <AnimatePresence>
                        {colAppointments.length === 0 ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-32 flex flex-col items-center justify-center text-slate-400">
                             <col.icon className="w-8 h-8 mb-2 opacity-50" />
                             <p className="text-sm font-medium">No patients {col.title.toLowerCase()}</p>
                          </motion.div>
                        ) : (
                          colAppointments.map(apt => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              key={apt.id} 
                              className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-extrabold text-slate-800 text-sm">{apt.patient_first_name} {apt.patient_last_name}</h4>
                                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5">ID: {apt.patient_reg_id}</p>
                                </div>
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {apt.appointment_time?.slice(0,5)}
                                </span>
                              </div>
                              
                              <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Assigned Doctor</p>
                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                  <ProfileAvatar user={{ first_name: apt.doctor_first_name, last_name: apt.doctor_last_name }} className="w-6 h-6 rounded-md" />
                                  Dr. {apt.doctor_first_name} {apt.doctor_last_name}
                                </p>
                              </div>

                              {col.action && (
                                <button 
                                  onClick={() => handleStatusUpdate(apt.id, col.nextStatus)}
                                  className={`w-full py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${styles.btn}`}
                                >
                                  {col.action} <ArrowRight className="w-4 h-4" />
                                </button>
                              )}
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <RefundList user={{ role: 'RECEPTIONIST' }} />
          </div>
        </div>
      )}
    </ReceptionLayout>
  );
};

export default ReceptionDashboard;
