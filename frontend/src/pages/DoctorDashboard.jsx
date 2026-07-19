import React, { useState, useEffect } from 'react';
import DoctorLayout from '../layouts/DoctorLayout';
import axios from '../api/axios';
import { Calendar, Users, ClipboardList, CheckCircle, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, CartesianGrid, XAxis, YAxis, AreaChart, Area } from 'recharts';
import RefundList from '../components/RefundList';

const COLORS = ['#14b8a6', '#8b5cf6', '#f59e0b', '#ec4899'];

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    uniquePatients: 0,
    todaysAppointments: 0,
    completedPatients: 0,
    pendingPatients: 0,
    followUps: 0,
    weeklyTrend: [],
    demographics: [],
    reviews: { total: 0, average: 0 }
  });
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        
        // Fetch dashboard stats
        const { data: statsData } = await axios.get('/api/dashboard/stats', config);
        setStats({ ...statsData, demographics: (statsData.demographics || []).map(d => ({ ...d, count: Number(d.count) })), weeklyTrend: (statsData.weeklyTrend || []).map(d => ({ ...d, count: Number(d.count) })) });

        // Fetch today's appointments
        const { data: appts } = await axios.get('/api/appointments', config);
        const todayStr = new Date().toDateString();
        const filtered = appts.filter(a => new Date(a.appointment_date).toDateString() === todayStr);
        setTodaysAppointments(filtered);

      } catch (error) {
        console.error('Error fetching dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { title: 'Today\'s Appointments', value: stats.todaysAppointments, icon: Calendar, color: 'bg-teal-50 text-teal-600 border border-teal-100' },
    { title: 'Total Patients', value: stats.uniquePatients, icon: Users, color: 'bg-blue-50 text-blue-600 border border-blue-100' },
    { title: 'Completed Consults', value: stats.completedPatients, icon: CheckCircle, color: 'bg-green-50 text-green-600 border border-green-100' },
    { title: 'Pending Actions', value: stats.pendingPatients, icon: ClipboardList, color: 'bg-amber-50 text-amber-600 border border-amber-100' },
    { title: 'Follow-ups', value: stats.followUps, icon: Clock, color: 'bg-purple-50 text-purple-600 border border-purple-100' },
    { title: 'Average Rating', value: `${stats.reviews?.average || 0} / 5.0`, icon: Star, color: 'bg-yellow-50 text-yellow-600 border border-yellow-100' },
    { title: 'Total Reviews', value: stats.reviews?.total || 0, icon: Star, color: 'bg-amber-50 text-amber-600 border border-amber-100' },
  ];

  return (
    <DoctorLayout title="Clinic Overview">
      {loading ? (
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Today's Schedule</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-mono">{new Date().toDateString()}</span>
            </div>
            {todaysAppointments.length === 0 ? (
               <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-500">No appointments scheduled for today</p>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 font-semibold text-sm text-slate-600">Time</th>
                      <th className="px-6 py-4 font-semibold text-sm text-slate-600">Patient</th>
                      <th className="px-6 py-4 font-semibold text-sm text-slate-600">Type</th>
                      <th className="px-6 py-4 font-semibold text-sm text-slate-600">Status</th>
                      <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todaysAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 font-medium text-slate-800">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {apt.appointment_time}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-800">{apt.patient_first_name} {apt.patient_last_name}</p>
                            <p className="text-xs text-slate-500 font-mono">ID: {apt.patient_reg_id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm font-medium capitalize">
                          {apt.type.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            apt.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                            apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a href="/doctor/appointments">
                            <button className="px-3.5 py-1.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg hover:bg-teal-100 transition-colors">
                              Manage
                            </button>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
             <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Patient Demographics (Gender)</h3>
                {stats.demographics && stats.demographics.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.demographics}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="gender"
                          stroke="none"
                        >
                          {stats.demographics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                     <p className="text-slate-500">No demographics data available yet.</p>
                  </div>
                )}
             </div>

             <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Weekly Patient Trend</h3>
                {stats.weeklyTrend && stats.weeklyTrend.length > 0 ? (
                  <div className="h-72 w-full text-slate-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.weeklyTrend}>
                        <defs>
                          <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, {weekday: 'short'})} />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#14b8a6' }} />
                        <Area type="monotone" dataKey="count" stroke="#14b8a6" fillOpacity={1} fill="url(#colorPatients)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                     <p className="text-slate-500">No weekly trend data available yet.</p>
                  </div>
                )}
             </div>
          </div>

          <div className="mt-8">
            <RefundList user={{ role: 'DOCTOR' }} />
          </div>
        </div>
      )}
    </DoctorLayout>
  );
};

export default DoctorDashboard;
