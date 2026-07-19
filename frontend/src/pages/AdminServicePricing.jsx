import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import axios from '../api/axios';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminServicePricing = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.get('/api/service-prices', config);
      setPrices(data);
    } catch (error) {
      console.error('Error fetching service prices', error);
      toast.error('Failed to load service prices.');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (id, newPrice) => {
    setPrices(prev => prev.map(p => p.id === id ? { ...p, price: newPrice } : p));
  };

  const handleSave = async (priceObj) => {
    setSavingId(priceObj.id);
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put(`/api/service-prices/${priceObj.id}`, { price: Number(priceObj.price), is_active: priceObj.is_active }, config);
      toast.success(`${priceObj.service_name} price updated successfully.`);
    } catch (error) {
      toast.error('Failed to update price.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout title="Service Pricing">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
               <Settings className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-800">Hospital Service Pricing</h2>
               <p className="text-sm text-slate-500">Configure default prices for various hospital services.</p>
             </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex items-start gap-3 text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p><strong>Note:</strong> Changes to service prices will only apply to new requests and invoices generated after the change. Existing unpaid invoices will not be affected.</p>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
               {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>)}
            </div>
          ) : (
            <div className="space-y-4">
              {prices.map(item => (
                <div key={item.id} className="p-4 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{item.service_name}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-1 uppercase">{item.service_type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input 
                        type="number" 
                        value={item.price}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        className="pl-8 pr-4 py-2 border-2 border-slate-200 rounded-xl font-bold text-slate-900 w-32 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <button 
                      onClick={() => handleSave(item)}
                      disabled={savingId === item.id}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {savingId === item.id ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminServicePricing;
