import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { RefreshCcw, Search, DollarSign, Calendar, XCircle, CheckCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RefundList = ({ user }) => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.get('/api/refunds', config);
      setRefunds(data);
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [user]);

  const filteredRefunds = refunds.filter(r => 
    r.patient_first_name?.toLowerCase().includes(search.toLowerCase()) || 
    r.patient_last_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.doctor_last_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.transaction_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden p-6 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
            {user?.role === 'PATIENT' ? 'My Refunds & Cancellations' : 'Refunds & Cancellations History'}
          </h2>
          <p className="text-slate-500 font-medium mt-1 mb-3">
            Tracking cancelled appointments and refunded payments.
          </p>
          {user?.role === 'PATIENT' && (
            <div className="bg-orange-50 border-l-4 border-orange-500 text-orange-800 text-sm p-3 rounded-r-lg max-w-lg">
              <strong>Refund Policy:</strong> Refunds are only processed for PAID appointments that are cancelled while in the PENDING state. Refunds usually reflect within 5-7 business days.
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search refunds..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
            />
          </div>
          <button 
            onClick={fetchRefunds}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin text-red-500' : ''}`} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/60 bg-white/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
              {user?.role !== 'PATIENT' && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>}
              {user?.role !== 'DOCTOR' && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>}
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction ID</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cancelled By</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {loading && refunds.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-3">
                      <RefreshCcw className="w-5 h-5 animate-spin text-red-500" />
                      Loading refunds...
                    </div>
                  </td>
                </tr>
              ) : filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-semibold text-lg">No refunds found</p>
                    <p className="text-slate-400 mt-1">There are no cancellation or refund records matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((refund, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={refund.id} 
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">
                          {new Date(refund.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 ml-6 mt-0.5">
                        {new Date(refund.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    
                    {user?.role !== 'PATIENT' && (
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{refund.patient_first_name} {refund.patient_last_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 max-w-[150px] truncate" title={refund.reason}>{refund.reason || 'No reason provided'}</div>
                      </td>
                    )}
                    
                    {user?.role !== 'DOCTOR' && (
                      <td className="p-4">
                        <div className="font-bold text-slate-800">Dr. {refund.doctor_first_name} {refund.doctor_last_name}</div>
                      </td>
                    )}
                    
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-bold text-red-600">
                        <DollarSign className="w-4 h-4" />
                        {Number(refund.refund_amount).toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Paid: ${Number(refund.amount_paid).toFixed(2)}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {refund.refund_status}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      <div className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit border border-slate-200">
                        {refund.transaction_id || 'N/A'}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {refund.cancelled_by_first_name?.[0] || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-700 text-sm">
                            {refund.cancelled_by_first_name} {refund.cancelled_by_last_name}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                            {refund.cancelled_by_role}
                          </div>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RefundList;
