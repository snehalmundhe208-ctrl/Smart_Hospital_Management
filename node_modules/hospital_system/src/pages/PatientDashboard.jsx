import React, { useState, useEffect } from 'react';
import PatientLayout from '../layouts/PatientLayout';
import axios from '../api/axios';
import { Calendar, FileText, Clock, Plus, ArrowRight, Download, ShoppingBag, FlaskConical, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { downloadMedicalReport, downloadMedicalCertificate } from '../utils/exportUtils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
import RefundList from '../components/RefundList';

const CHART_COLORS = { 'PENDING': '#f59e0b', 'CONFIRMED': '#3b82f6', 'CHECKED_IN': '#6366f1', 'IN_CONSULTATION': '#a855f7', 'COMPLETED': '#10b981', 'CANCELLED': '#ef4444' };

const PatientDashboard = () => {
  const { user } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalPrescriptions: 0,
    totalMedicineOrders: 0
  });
  const [upcoming, setUpcoming] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        
        // Fetch dashboard stats
        const { data: statsData } = await axios.get('/api/dashboard/stats', config);
        if(isMounted) setStats(statsData);

        // Fetch appointments
        const { data: appts } = await axios.get('/api/appointments', config);
        const upcomingApts = appts.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status));
        if(isMounted) {
           setUpcoming(upcomingApts.slice(0, 3));
           setPendingCount(appts.filter(a => a.status === 'PENDING').length);
        }

        // Fetch prescriptions
        const { data: rxList } = await axios.get('/api/prescriptions', config);
        if(isMounted) setPrescriptions(rxList.slice(0, 3));

        // Fetch lab reports
        const { data: labData } = await axios.get('/api/lab/requests', config);
        if(isMounted) {
           setLabReports(labData.filter(r => r.report_url).slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching dashboard stats', error);
      } finally {
        if(isMounted) setLoading(false);
      }
    };
    
    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 5000);
    
    return () => {
       isMounted = false;
       clearInterval(intervalId);
    };
  }, []);

  const statCards = [
    { title: 'Total Appointments', value: stats.totalAppointments, icon: Calendar, color: 'bg-emerald-50 text-emerald-600 border border-emerald-100', link: '/patient/appointments' },
    { title: 'Pending Appointments', value: pendingCount, icon: Clock, color: 'bg-amber-50 text-amber-600 border border-amber-100', link: '/patient/appointments' },
    { title: 'Digital Prescriptions', value: stats.totalPrescriptions, icon: FileText, color: 'bg-blue-50 text-blue-600 border border-blue-100', link: '/patient/appointments' },
    { title: 'Pharmacy Store', value: 'Buy Now', icon: ShoppingBag, color: 'bg-purple-50 text-purple-600 border border-purple-100', link: '/patient/medicines' },
  ];

  const handleCancelAppointment = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put(`/api/appointments/${id}/status`, { status: 'CANCELLED' }, config);
      setUpcoming(prev => prev.filter(a => a.id !== id));
      setPendingCount(prev => Math.max(0, prev - 1));
      setNotice('Appointment cancelled successfully.');
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to cancel this appointment.');
    }
  };

  const handleDownloadReport = async (rx) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.get(`/api/prescriptions/${rx.id}`, config);
      downloadMedicalReport(data, user, []);
    } catch (error) {
      console.error('Error downloading report', error);
      setNotice('Failed to download the medical report.');
    }
  };

  return (
    <PatientLayout title="Patient Portal">
      {loading ? (
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {notice && <div role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div>}
          {/* Quick Actions & Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div className="flex bg-white/70 backdrop-blur-xl p-1 rounded-xl border border-white/60 shadow-sm inline-flex">
                <button
                  onClick={() => setActiveTab('DASHBOARD')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'DASHBOARD' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('REFUNDS')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'REFUNDS' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}
                >
                  Refunds & History
                </button>
             </div>
             
             <Link to="/patient/book-appointment">
               <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:bg-emerald-700 transition-colors"
               >
                  <Plus className="w-5 h-5" /> Book Appointment
               </motion.button>
             </Link>
          </div>

          {activeTab === 'REFUNDS' ? (
             <div className="mt-8">
               <RefundList user={user} />
             </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, idx) => (
              <Link to={stat.link} key={idx}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer h-full"
                >
                  <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                    <h3 className="text-xl font-bold text-slate-800">{stat.value}</h3>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mt-8">
             <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Appointment History</h3>
                {stats.appointmentHistory && stats.appointmentHistory.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.appointmentHistory}>
                        <defs>
                          <linearGradient id="colorPatientHist" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#10b981' }} />
                        <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorPatientHist)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                     <p className="text-slate-500">No history available.</p>
                  </div>
                )}
             </div>

             <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Appointment Statuses</h3>
                {stats.appointmentStatus && stats.appointmentStatus.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.appointmentStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                          stroke="none"
                        >
                          {stats.appointmentStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.name] || '#8b5cf6'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                     <p className="text-slate-500">No status data available.</p>
                  </div>
                )}
             </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mt-8">
             {/* Upcoming Appointments */}
             <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Upcoming Appointments</h3>
                  <Link to="/patient/appointments" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                
                {upcoming.length === 0 ? (
                  <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      <p className="text-slate-500">No upcoming appointments scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcoming.map(apt => (
                      <div key={apt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex flex-col items-center justify-center text-emerald-800 font-bold">
                            <span className="text-[10px] uppercase">{new Date(apt.appointment_date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-sm leading-tight">{new Date(apt.appointment_date).getDate()}</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Dr. {apt.doctor_first_name} {apt.doctor_last_name}</p>
                            <p className="text-xs text-slate-500">{apt.specialization}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {apt.status}
                          </span>
                          <p className="text-xs text-slate-500 font-medium">{apt.appointment_time}</p>
                          {apt.status === 'PENDING' && (
                            <button 
                              onClick={() => handleCancelAppointment(apt.id)}
                              className="text-[10px] px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             {/* Recent Prescriptions */}
             <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mb-10 pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Recent Prescriptions</h3>
                  <Link to="/patient/medicines" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">Order medicines <ArrowRight className="w-3.5 h-3.5" /></Link>
                </div>
                
                {prescriptions.length === 0 ? (
                  <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      <p className="text-slate-500">No active digital prescriptions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map(rx => (
                      <div key={rx.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Prescription from Dr. {rx.doctor_last_name}</p>
                            <p className="text-xs text-slate-500">{rx.specialization} • {new Date(rx.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded-full font-bold">
                            Active
                          </span>
                          <button 
                            onClick={() => handleDownloadReport(rx)}
                            className="text-[10px] flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 font-bold transition-colors"
                          >
                            <Download className="w-3 h-3" /> Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             {/* Lab Reports */}
             <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden lg:col-span-2">
                <div className="absolute top-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Lab Reports</h3>
                </div>
                
                {labReports.length === 0 ? (
                  <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      <p className="text-slate-500">No lab reports available yet</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {labReports.map(report => (
                      <div key={report.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center">
                            <FlaskConical className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{report.test_name}</p>
                            <p className="text-xs text-slate-500">
                              Uploaded: {new Date(report.updated_at).toLocaleDateString()} 
                              {report.technician_name ? ` • By: ${report.technician_name}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
                            {report.status}
                          </span>
                          <a 
                            href={report.report_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-100 font-bold transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> Download PDF
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
            </>
          )}
        </div>
      )}
    </PatientLayout>
  );
};

export default PatientDashboard;

