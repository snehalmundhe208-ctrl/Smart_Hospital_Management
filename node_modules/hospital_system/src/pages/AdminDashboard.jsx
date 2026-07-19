import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import axios from 'axios';
import { Users, Activity, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Clock, Plus, XCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import RefundList from '../components/RefundList';

const STATUS_COLORS = { 'COMPLETED': '#10b981', 'PENDING': '#f59e0b', 'CANCELLED': '#ef4444', 'RESCHEDULED': '#3b82f6', 'CONFIRMED': '#0ea5e9', 'SAMPLE_COLLECTED': '#f59e0b' };

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    staff: 0,
    appointments: 0,
    revenue: 0,
    revenueTrends: [],
    appointmentTrends: [],
    departmentStats: [],
    appointmentStatus: [],
    monthlyAppointments: [],
    cancelledAppointments: 0,
    refundedAppointments: 0,
    totalRefundAmount: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatsAndActivity = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        
        // Fetch dashboard stats
        const { data: statsData } = await axios.get('/api/dashboard/stats', config);
        setStats({
          ...statsData,
          appointmentStatus: (statsData.appointmentStatus || []).map(d => ({ ...d, value: Number(d.value) }))
        });

        // Fetch top 10 audit logs for recent activities
        const { data: auditData } = await axios.get('/api/audit?limit=10', config);
        const logs = (auditData.data || []).map(log => ({
          id: log.id,
          time: new Date(log.created_at),
          title: log.action,
          desc: log.details,
          type: log.module,
          status: log.status,
          user: log.first_name ? `${log.first_name} ${log.last_name}` : 'System'
        }));

        setActivities(logs);

      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatsAndActivity();
    const interval = setInterval(fetchStatsAndActivity, 5000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { title: 'Total Patients', value: stats.patients, icon: Users, color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
    { title: 'Total Doctors', value: stats.doctors, icon: Activity, color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
    { title: 'Appointments', value: stats.appointments, icon: Calendar, color: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
    { title: 'Cancelled', value: stats.cancelledAppointments || 0, icon: XCircle, color: 'bg-red-500/10 text-red-400 border border-red-500/20' },
    { title: 'Refunded Apts', value: stats.refundedAppointments || 0, icon: CheckCircle, color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    { title: 'Total Refunds', value: `$${stats.totalRefundAmount || 0}`, icon: DollarSign, color: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
    { title: 'Net Revenue', value: `$${stats.revenue}`, icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  ];

  return (
    <AdminLayout title="Admin Command Center">
      {loading && stats.patients === 0 ? (
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {statCards.map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/90 backdrop-blur-xl p-4 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col items-center justify-center gap-2 hover:border-blue-500/30 transition-all hover:-translate-y-1 cursor-default group"
              >
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-extrabold text-slate-800">{stat.value}</h3>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">{stat.title}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Recent Activities */}
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2 relative z-10">
                <Clock className="w-5 h-5 text-blue-500" /> Recent Activities
              </h3>
              
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                     <p>No recent activity detected</p>
                  </div>
                ) : (
                  <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-6">
                    {activities.map((act, idx) => (
                      <motion.div 
                        key={act.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative"
                      >
                        {/* Timeline dot */}
                        <span className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-slate-900 ${
                          act.type === 'patient' ? 'bg-emerald-500' : 
                          act.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-amber-500'
                        }`} />
                        
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-700 text-sm">{act.title}</h4>
                              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-500 bg-slate-100 rounded-md uppercase border border-slate-200">
                                {act.type || 'SYSTEM'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mb-1">{act.desc}</p>
                            <p className="text-[10px] text-slate-400 font-medium">By: {act.user}</p>
                          </div>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap font-semibold">
                            {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

              </div>
          
          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
             <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Revenue Trends (Last 7 Days)</h3>
                <div className="h-72 w-full text-slate-700">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.revenueTrends}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, {weekday: 'short'})} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} itemStyle={{ color: '#10b981' }} />
                      <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>
             
             <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Department-wise Patients</h3>
                <div className="h-72 w-full text-slate-700">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.departmentStats}>
                      <defs>
                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} itemStyle={{ color: '#0ea5e9' }} cursor={{ fill: '#334155' }} />
                      <Bar dataKey="patients" fill="url(#colorBar)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>
             
             <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Appointment Status</h3>
                <div className="h-72 w-full text-slate-700">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.appointmentStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                        cornerRadius={5}
                      >
                        {stats.appointmentStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toUpperCase()] || '#8b5cf6'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} formatter={(value) => [value, 'Appointments']} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             </div>
             
             <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Monthly Appointments (6 Months)</h3>
                <div className="h-72 w-full text-slate-700">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.monthlyAppointments}>
                      <defs>
                        <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} itemStyle={{ color: '#3b82f6' }} />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAppointments)" strokeWidth={3} isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

          <div className="mt-8">
             <RefundList user={{ role: 'ADMIN' }} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;



