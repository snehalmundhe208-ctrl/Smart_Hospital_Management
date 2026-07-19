import React, { useEffect, useState } from 'react';
import LabLayout from '../layouts/LabLayout';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { FlaskConical, CheckCircle, Clock, FileText, Pencil, X, Save, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_COLORS = ['#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#3b82f6'];

const LabDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [reportForm, setReportForm] = useState({ status: 'PENDING', report_url: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState({ volumes: [], totalTests: 0, pendingReports: 0, completedReports: 0, dailyVolume: [] });

  const { user } = React.useContext(AuthContext);

  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
  const fetchRequests = async () => {
    try {
      const [reqRes, statsRes] = await Promise.all([
        axios.get('/api/lab/requests', config),
        axios.get('/api/dashboard/stats', config)
      ]);
      setRequests(reqRes.data);
      setStats({ ...statsRes.data, dailyVolume: (statsRes.data.dailyVolume || []).map(d => ({ ...d, count: Number(d.count) })), volumes: (statsRes.data.volumes || []).map(d => ({ ...d, value: Number(d.value) })) });
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to load lab data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchRequests(); 
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const openReportModal = (request, mode) => {
    setSelectedRequest(request);
    setModalMode(mode);
    setReportForm({ status: request.status, report_url: request.report_url || '' });
    setSelectedFile(null);
  };

  const updateReport = async (event) => {
    event.preventDefault();
    if (!selectedRequest) return;
    setSaving(true);
    try {
      let finalReportUrl = reportForm.report_url;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await axios.post('/api/upload', formData, {
          headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
        });
        finalReportUrl = uploadRes.data.url;
      }
      
      const payload = {
        status: reportForm.status,
        report_url: finalReportUrl,
        technician_name: user ? `${user.first_name} ${user.last_name}` : 'Lab Technician'
      };

      const { data } = await axios.put(`/api/lab/requests/${selectedRequest.id}`, payload, config);
      setRequests((current) => current.map((request) => request.id === data.id ? { ...request, ...data } : request));
      setNotice(`Report for ${selectedRequest.test_name} updated and the patient was notified.`);
      setSelectedRequest(null);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to update this report.');
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { title: 'Total Requests', value: stats.totalTests, icon: FlaskConical, color: 'bg-purple-50 text-purple-600 border border-purple-100' },
    { title: 'Pending Samples', value: stats.pendingReports, icon: Clock, color: 'bg-amber-50 text-amber-600 border border-amber-100' },
    { title: 'Completed Tests', value: stats.completedReports, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  ];
  const statusClass = (status) => status === 'PENDING' ? 'bg-amber-100 text-amber-700' : status === 'SAMPLE_COLLECTED' ? 'bg-blue-100 text-blue-700' : status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700';

  return (
    <LabLayout title="Laboratory Command">
      {loading ? <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" /></div> : <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-xl sm:px-8" style={{ backgroundImage: "linear-gradient(90deg, rgba(30,27,75,.95), rgba(30,27,75,.68)), url('/images/healthcare-team-hero.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-200"><FlaskConical className="h-4 w-4" /> Digital diagnostics</p>
          <h2 className="text-2xl font-extrabold">Report-ready care, without the paper trail.</h2>
          <p className="mt-2 max-w-2xl text-sm text-indigo-100">Update sample progress, attach published reports, and keep patients informed from one queue.</p>
        </section>
        {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-800"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}><X className="h-4 w-4" /></button></div>}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">{statCards.map((stat, index) => <motion.div key={stat.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"><div className={`w-14 h-14 rounded-xl ${stat.color} flex items-center justify-center`}><stat.icon className="w-7 h-7" /></div><div><p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p><h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3></div></motion.div>)}</div>
        
        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8 mt-4 mb-4">
             <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Top Diagnostic Tests</h3>
                {stats.volumes && stats.volumes.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.volumes} layout="vertical" margin={{ left: 20 }}>
                        <defs>
                          <linearGradient id="colorLabBar" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#ec4899" stopOpacity={1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                        <Tooltip cursor={{ fill: '#f8fafc', stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3 3" }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#8b5cf6' }} />
                        <Bar dataKey="count" fill="url(#colorLabBar)" radius={[0, 6, 6, 0]} isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                     <p className="text-slate-500">No top tests data available.</p>
                  </div>
                )}
             </div>

             <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Pending vs Completed</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pending', value: stats.pendingReports || 0, fill: '#f59e0b' },
                          { name: 'Completed', value: stats.completedReports || 0, fill: '#10b981' }
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
                      </Pie>
                      <Tooltip cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3 3" }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             </div>
             
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex flex-col mb-4">
                <h3 className="text-sm font-bold text-slate-800">Daily Tests (Live)</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5"><div className="w-4 h-1 bg-purple-500 rounded-full"></div><span className="text-xs text-slate-500 font-bold">Tests</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-4 h-0 border-t-2 border-dashed border-purple-500 rounded-full"></div><span className="text-xs text-slate-500 font-bold">Avg Line</span></div>
                </div>
              </div>
              {stats.dailyVolume ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={(() => {
                        const dates = [];
                        for (let i = 6; i >= 0; i--) {
                          const d = new Date();
                          d.setDate(d.getDate() - i);
                          dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                        }
                        const padded = dates.map(dateStr => {
                          const found = (stats.dailyVolume || []).find(v => v.date === dateStr);
                          return { date: dateStr, count: found ? found.count : 0 };
                        });
                        return padded.map((d, i, arr) => {
                          const overallAvg = arr.reduce((sum, item) => sum + item.count, 0) / arr.length;
                          return { ...d, avg: Number(overallAvg.toFixed(1)) };
                        });
                      })()}>
                        <defs>
                          <linearGradient id="colorLabDaily" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 'bold' }}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 'bold' }}
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                          itemStyle={{ fontWeight: 'bold' }} 
                        />
                        <Area 
                          type="linear" 
                          dataKey="count"
                          name="Tests" 
                          stroke="#8b5cf6" 
                          fill="url(#colorLabDaily)" 
                          strokeWidth={2} 
                          activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }}
                          isAnimationActive={true} 
                          animationDuration={1500} 
                        />
                        <Line
                          type="linear"
                          dataKey="avg"
                          name="Avg Line"
                          stroke="#8b5cf6"
                          strokeDasharray="5 5"
                          strokeWidth={1}
                          dot={false}
                          activeDot={false}
                          isAnimationActive={true}
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                   <p className="text-slate-500">No daily volume data available.</p>
                </div>
              )}
              
              {/* Match Bottom Stats from Image */}
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="flex flex-col border-r border-slate-100 px-4">
                  <span className="text-xs font-bold text-slate-500 mb-1">Total Tests</span>
                  <span className="text-2xl font-extrabold text-slate-900">{stats.totalTests || 0}</span>
                  <span className="text-xs font-bold text-emerald-500 mt-1 flex items-center">↑ 14.3%</span>
                </div>
                <div className="flex flex-col border-r border-slate-100 px-4">
                  <span className="text-xs font-bold text-slate-500 mb-1">Pending</span>
                  <span className="text-2xl font-extrabold text-slate-900">{stats.pendingReports || 0}</span>
                  <span className="text-xs font-bold text-emerald-500 mt-1 flex items-center">↑ 6.1%</span>
                </div>
                <div className="flex flex-col border-r border-slate-100 px-4">
                  <span className="text-xs font-bold text-slate-500 mb-1">Completed</span>
                  <span className="text-2xl font-extrabold text-slate-900">{stats.completedReports || 0}</span>
                  <span className="text-xs font-bold text-emerald-500 mt-1 flex items-center">↑ 17.6%</span>
                </div>
                <div className="flex flex-col px-4">
                  <span className="text-xs font-bold text-slate-500 mb-1">Cancelled</span>
                  <span className="text-2xl font-extrabold text-slate-900">0</span>
                  <span className="text-xs font-bold text-red-500 mt-1 flex items-center">↓ 1.2%</span>
                </div>
              </div>
           </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 bg-slate-50/70 p-6"><h3 className="text-lg font-bold text-slate-800">Lab Test Requests</h3><p className="mt-1 text-sm text-slate-500">Each report update is reflected in the patient portal.</p></div>{requests.length === 0 ? <div className="flex items-center justify-center h-48 text-slate-500"><p>No lab test requests</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left border-collapse"><thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-6 py-4 font-semibold text-sm text-slate-600">Test Name</th><th className="px-6 py-4 font-semibold text-sm text-slate-600">Patient</th><th className="px-6 py-4 font-semibold text-sm text-slate-600">Doctor</th><th className="px-6 py-4 font-semibold text-sm text-slate-600">Status</th><th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{requests.map((request) => <tr key={request.id} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4 font-bold text-slate-800">{request.test_name}</td><td className="px-6 py-4 text-slate-600">{request.patient_first_name} {request.patient_last_name}<br /><span className="text-xs text-slate-400">{request.patient_reg_id}</span></td><td className="px-6 py-4 text-slate-600 font-medium">Dr. {request.doctor_first_name} {request.doctor_last_name}</td><td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(request.status)}`}>{request.status.replace('_', ' ')}</span></td><td className="px-6 py-4 text-right"><div className="inline-flex gap-1"><button onClick={() => openReportModal(request, 'view')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"><FileText className="h-4 w-4" /> View Report</button><button onClick={() => openReportModal(request, 'edit')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-purple-700 hover:bg-purple-50"><Pencil className="h-4 w-4" /> Update Report</button></div></td></tr>)}</tbody></table></div>}</section>
      </div>}

      {selectedRequest && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">{modalMode === 'view' ? <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between"><div><p className="text-sm font-semibold text-blue-700">Diagnostic report</p><h2 className="text-xl font-extrabold text-slate-900">{selectedRequest.test_name}</h2></div><button aria-label="Close report" onClick={() => setSelectedRequest(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><dl className="grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Patient</dt><dd className="mt-1 font-bold text-slate-800">{selectedRequest.patient_first_name} {selectedRequest.patient_last_name}</dd></div><div><dt className="text-slate-500">Ordering doctor</dt><dd className="mt-1 font-bold text-slate-800">Dr. {selectedRequest.doctor_first_name} {selectedRequest.doctor_last_name}</dd></div><div><dt className="text-slate-500">Status</dt><dd className="mt-1"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(selectedRequest.status)}`}>{selectedRequest.status.replace('_', ' ')}</span></dd></div><div><dt className="text-slate-500">Requested</dt><dd className="mt-1 font-bold text-slate-800">{new Date(selectedRequest.created_at).toLocaleDateString()}</dd></div></dl>{selectedRequest.report_url ? <a href={selectedRequest.report_url} target="_blank" rel="noreferrer" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700"><ExternalLink className="h-4 w-4" /> Open Published Report</a> : <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">No report link has been attached yet. Use Update Report to add one.</div>}</div> : <form onSubmit={updateReport} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between"><div><p className="text-sm font-semibold text-purple-700">Laboratory workflow</p><h2 className="text-xl font-extrabold text-slate-900">Update {selectedRequest.test_name}</h2></div><button type="button" aria-label="Close report update" onClick={() => setSelectedRequest(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><label className="block text-sm font-bold text-slate-700">Test status<select value={reportForm.status} onChange={(event) => setReportForm((current) => ({ ...current, status: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-900 outline-none ring-purple-500 focus:ring-2"><option value="PENDING">Pending</option><option value="SAMPLE_COLLECTED">Sample collected</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></label><label className="mt-5 block text-sm font-bold text-slate-700">Upload Report File <span className="font-normal text-slate-400">(PDF or Image)</span><input type="file" accept=".pdf,image/*" onChange={(event) => setSelectedFile(event.target.files[0])} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-900 outline-none ring-purple-500 focus:ring-2" /></label><div className="mt-6 flex gap-3"><button type="button" onClick={() => setSelectedRequest(null)} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 hover:bg-slate-200">Cancel</button><button disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-bold text-white hover:bg-purple-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save Report'}</button></div></form>}</div>}
    </LabLayout>
  );
};

export default LabDashboard;

