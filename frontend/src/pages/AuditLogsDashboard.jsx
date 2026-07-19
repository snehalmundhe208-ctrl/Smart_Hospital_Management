import React, { useState, useEffect, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import AdminLayout from '../layouts/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Activity, CheckCircle2, XCircle, AlertCircle, Clock, Eye, X, RefreshCw, Smartphone, Globe, Code, Users } from 'lucide-react';
import { format } from 'date-fns';

const StatusBadge = ({ status, action = '' }) => {
  let finalStatus = status;
  if (!finalStatus || finalStatus === 'UNKNOWN') {
    const act = action.toUpperCase();
    if (act.includes('FAIL') || act.includes('ERROR')) finalStatus = 'FAILED';
    else if (act.includes('DELETE') || act.includes('REMOVE')) finalStatus = 'WARNING';
    else if (act.includes('UPDATE') || act.includes('EDIT')) finalStatus = 'INFO';
    else finalStatus = 'SUCCESS';
  }
  const styles = {
    SUCCESS: 'bg-green-500/10 text-green-700 border-green-500/20',
    FAILED: 'bg-red-500/10 text-red-700 border-red-500/20',
    WARNING: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    INFO: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  };
  const defaultStyle = 'bg-slate-500/10 text-slate-700 border-slate-500/20';
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${styles[finalStatus] || defaultStyle}`}>
      {finalStatus}
    </span>
  );
};

const ModuleBadge = ({ module }) => {
  return (
    <span className="px-2.5 py-1 text-[11px] font-bold tracking-wider text-slate-600 bg-slate-100 rounded-md uppercase border border-slate-200">
      {module || 'SYSTEM'}
    </span>
  );
};

const AuditLogsDashboard = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDays, setFilterDays] = useState('');
  const [isTimelineView, setIsTimelineView] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['auditStats'],
    queryFn: async () => {
      const res = await axios.get('/api/audit/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.data;
    },
    refetchInterval: 5000,
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['auditLogs', page, limit, search, filterModule, filterStatus, filterDays],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit });
      if (search) params.append('search', search);
      if (filterModule) params.append('module', filterModule);
      if (filterStatus) params.append('status', filterStatus);
      if (filterDays) params.append('days', filterDays);
      const res = await axios.get(`/api/audit?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.data;
    },
    refetchInterval: 5000,
    keepPreviousData: true,
  });

  const handleExport = (type) => {
    alert(`Export to ${type} is coming soon!`);
  };

  const handleFilterClick = (type, val) => {
    if (type === 'days') setFilterDays(val === filterDays ? '' : val);
    if (type === 'module') setFilterModule(val === filterModule ? '' : val);
    setPage(1);
  };

  return (
    <AdminLayout title="Audit Logs">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <SummaryCard icon={Activity} title="Total Logs" value={stats?.totalLogs || 0} loading={statsLoading} color="blue" />
        <SummaryCard icon={CheckCircle2} title="Successful" value={stats?.successful || 0} loading={statsLoading} color="green" />
        <SummaryCard icon={XCircle} title="Failed" value={stats?.failed || 0} loading={statsLoading} color="red" />
        <SummaryCard icon={AlertCircle} title="Warnings" value={stats?.warnings || 0} loading={statsLoading} color="amber" />
        <SummaryCard icon={Clock} title="Today" value={stats?.today || 0} loading={statsLoading} color="indigo" />
        <SummaryCard icon={Users} title="Active Users" value={stats?.activeUsers || 0} loading={statsLoading} color="teal" />
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-xl shadow-slate-200/50 mb-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill active={filterDays === '1'} onClick={() => handleFilterClick('days', '1')}>Today</FilterPill>
            <FilterPill active={filterDays === '7'} onClick={() => handleFilterClick('days', '7')}>Last 7 Days</FilterPill>
            <FilterPill active={filterDays === '30'} onClick={() => handleFilterClick('days', '30')}>Last 30 Days</FilterPill>
            <div className="w-px h-6 bg-slate-300 mx-2"></div>
            <FilterPill active={filterModule === 'AUTH'} onClick={() => handleFilterClick('module', 'AUTH')}>Login</FilterPill>
            <FilterPill active={filterModule === 'APPOINTMENTS'} onClick={() => handleFilterClick('module', 'APPOINTMENTS')}>Appointments</FilterPill>
            <FilterPill active={filterModule === 'PHARMACY'} onClick={() => handleFilterClick('module', 'PHARMACY')}>Pharmacy</FilterPill>
            <FilterPill active={filterModule === 'LAB'} onClick={() => handleFilterClick('module', 'LAB')}>Lab</FilterPill>
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 xl:w-64">
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            
            <button onClick={() => setIsTimelineView(!isTimelineView)} className="p-2 bg-white/50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-slate-600" title="Toggle View">
              {isTimelineView ? <Activity className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </button>
            <button onClick={() => handleExport('PDF')} className="p-2 bg-white/50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-slate-600" title="Export PDF">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Data View */}
        {logsLoading ? (
          <div className="flex justify-center items-center py-20"><RefreshCw className="w-8 h-8 text-blue-500 animate-spin" /></div>
        ) : isTimelineView ? (
          <TimelineView logs={logsData?.data || []} onViewDetails={setSelectedLog} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/30">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-4">Date & Time</th>
                  <th className="px-4 py-4">User</th>
                  <th className="px-4 py-4">Module</th>
                  <th className="px-4 py-4">Action</th>
                  <th className="px-4 py-4 w-full">Description</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 text-slate-700">
                {logsData?.data?.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-500">{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {log.first_name ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{log.first_name} {log.last_name}</span>
                            <span className="text-[10px] font-bold text-slate-400 capitalize">{log.role}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">System</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3"><ModuleBadge module={log.module} /></td>
                    <td className="px-4 py-3 font-bold text-slate-700">{log.action}</td>
                    <td className="px-4 py-3 truncate max-w-[300px] text-slate-600" title={log.details}>{log.details}</td>
                    <td className="px-4 py-3"><StatusBadge status={log.status} action={log.action} /></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedLog(log)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isTimelineView && logsData?.pagination && (
          <div className="flex justify-between items-center mt-6">
            <span className="text-sm text-slate-500 font-medium">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, logsData.pagination.total)} of {logsData.pagination.total} entries
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 font-medium text-sm transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-bold text-slate-700 px-3 bg-slate-50 border border-slate-100 py-2 rounded-xl shadow-inner">{page} / {logsData.pagination.totalPages}</span>
              <button 
                disabled={page === logsData.pagination.totalPages || logsData.pagination.totalPages === 0} 
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 font-medium text-sm transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLog(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden border border-white/50">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    Audit Log Details <StatusBadge status={selectedLog.status} action={selectedLog.action} />
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">{format(new Date(selectedLog.created_at), 'PPPP ppp')}</p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-white">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <DetailBox label="User" value={selectedLog.first_name ? `${selectedLog.first_name} ${selectedLog.last_name} (${selectedLog.role})` : 'System'} />
                  <DetailBox label="Module" value={<ModuleBadge module={selectedLog.module} />} />
                  <DetailBox label="Action" value={<span className="font-bold text-slate-800">{selectedLog.action}</span>} />
                  <DetailBox label="IP Address" value={selectedLog.ip_address || 'N/A'} icon={Globe} />
                  <DetailBox label="Device/Browser" value={selectedLog.device || 'N/A'} icon={Smartphone} className="col-span-2" />
                  <DetailBox label="Description" value={selectedLog.details} className="col-span-2" />
                </div>

                {(selectedLog.previous_value || selectedLog.new_value) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {selectedLog.previous_value && (
                      <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 shadow-sm">
                        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-3 flex items-center gap-2 bg-red-100 w-max px-3 py-1 rounded-lg"><Code className="w-4 h-4"/> Previous Value</h4>
                        <pre className="text-xs text-red-900 overflow-x-auto p-3 bg-red-100/50 rounded-xl font-mono shadow-inner border border-red-100">
                          {JSON.stringify(selectedLog.previous_value, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.new_value && (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 shadow-sm">
                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2 bg-emerald-100 w-max px-3 py-1 rounded-lg"><Code className="w-4 h-4"/> New Value</h4>
                        <pre className="text-xs text-emerald-900 overflow-x-auto p-3 bg-emerald-100/50 rounded-xl font-mono shadow-inner border border-emerald-100">
                          {JSON.stringify(selectedLog.new_value, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

const SummaryCard = ({ icon: Icon, title, value, loading, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20 text-blue-50',
    green: 'from-emerald-500 to-teal-500 shadow-emerald-500/20 text-emerald-50',
    red: 'from-rose-500 to-red-600 shadow-red-500/20 text-red-50',
    amber: 'from-amber-400 to-orange-500 shadow-orange-500/20 text-orange-50',
    indigo: 'from-indigo-500 to-violet-600 shadow-indigo-500/20 text-indigo-50',
    teal: 'from-teal-400 to-cyan-500 shadow-cyan-500/20 text-cyan-50',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} p-5 rounded-3xl shadow-lg relative overflow-hidden`}>
      <Icon className="absolute -right-4 -bottom-4 w-28 h-28 text-white/10 rotate-12" />
      <div className="relative z-10">
        <p className="text-white/80 font-semibold text-sm mb-1">{title}</p>
        <h4 className="text-3xl font-extrabold text-white tracking-tight">
          {loading ? <RefreshCw className="w-6 h-6 animate-spin mt-2" /> : value.toLocaleString()}
        </h4>
      </div>
    </div>
  );
};

const FilterPill = ({ children, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
      active 
        ? 'bg-slate-800 text-white shadow-md border border-slate-700' 
        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
    }`}
  >
    {children}
  </button>
);

const DetailBox = ({ label, value, className = '', icon: Icon }) => (
  <div className={`bg-slate-50/50 rounded-2xl p-4 border border-slate-200 shadow-sm ${className}`}>
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">{label}</span>
    <div className="text-sm font-semibold text-slate-700 flex items-center gap-2 break-words">
      {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
      {value}
    </div>
  </div>
);

const TimelineView = ({ logs, onViewDetails }) => (
  <div className="relative pl-8 py-6 max-w-4xl mx-auto">
    <div className="absolute left-10 top-0 bottom-0 w-1 bg-slate-100 rounded-full"></div>
    <div className="space-y-10">
      {logs.map((log, idx) => (
        <div key={log.id} className="relative flex gap-8 items-start group">
          <div className="absolute left-2.5 -translate-x-1/2 mt-2 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white group-hover:scale-125 group-hover:bg-blue-600 transition-all z-10 shadow-sm"></div>
          <div className="text-xs font-extrabold text-slate-400 w-20 pt-1.5 shrink-0 text-right">
            {format(new Date(log.created_at), 'hh:mm a')}
          </div>
          <div className="flex-1 bg-white border border-slate-200 p-5 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer" onClick={() => onViewDetails(log)}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
              <div className="font-extrabold text-slate-800 flex items-center gap-3">
                {log.first_name ? `${log.first_name} ${log.last_name}` : 'System'}
                <StatusBadge status={log.status} action={log.action} />
              </div>
              <ModuleBadge module={log.module} />
            </div>
            <p className="text-sm text-slate-600 mb-3 font-medium">{log.details}</p>
            <p className="text-[11px] uppercase tracking-wider text-blue-600 font-bold bg-blue-50 w-max px-2 py-1 rounded-md">{log.action}</p>
          </div>
        </div>
      ))}
      {logs.length === 0 && <p className="text-slate-500 py-10 text-center font-semibold">No recent activity logs found.</p>}
    </div>
  </div>
);

export default AuditLogsDashboard;
