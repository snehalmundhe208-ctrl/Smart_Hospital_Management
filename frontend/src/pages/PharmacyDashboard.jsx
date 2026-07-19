import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PharmacyLayout from '../layouts/PharmacyLayout';
import axios from '../api/axios';
import { Package, AlertTriangle, TrendingUp, Plus, Pencil, ClipboardList, X, Save, Boxes } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, CartesianGrid, XAxis, YAxis, AreaChart, Area, Line } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const emptyMedicine = { name: '', category: '', manufacturer: '', unit_price: '', stock_quantity: '', min_stock_level: '', expiry_date: '' };

const PharmacyDashboard = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockTarget, setStockTarget] = useState(null);
  const [stockForm, setStockForm] = useState({ quantity: 1, type: 'add' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [medicineForm, setMedicineForm] = useState(emptyMedicine);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState('ALL'); // ALL, LOW_STOCK, OUT_OF_STOCK

  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const [stats, setStats] = useState({ topSellers: [], ordersToday: 0, revenue: 0 });

  const fetchMedicines = async () => {
    try {
      const [medRes, statsRes] = await Promise.all([
        axios.get('/api/pharmacy/medicines', config),
        axios.get('/api/dashboard/stats', config)
      ]);
      setMedicines(medRes.data);
      setStats({ ...statsRes.data, topSellers: (statsRes.data.topSellers || []).map(d => ({ ...d, count: Number(d.count) })), orderTrends: (statsRes.data.orderTrends || []).map(d => ({ ...d, count: Number(d.count) })) });
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to load pharmacy inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchMedicines(); 
    const interval = setInterval(fetchMedicines, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStockUpdate = async (event) => {
    event.preventDefault();
    if (!stockTarget) return;
    setSaving(true);
    try {
      const { data } = await axios.put(`/api/pharmacy/medicines/${stockTarget.id}/stock`, stockForm, config);
      setMedicines((current) => current.map((medicine) => medicine.id === data.id ? data : medicine));
      setNotice(`${data.name} stock updated successfully.`);
      setStockTarget(null);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to update stock.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMedicine = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.post('/api/pharmacy/medicines', medicineForm, config);
      setMedicines((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNotice(`${data.name} added to inventory.`);
      setMedicineForm(emptyMedicine);
      setIsAddOpen(false);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to add medicine.');
    } finally {
      setSaving(false);
    }
  };

  const lowStock = medicines.filter((medicine) => Number(medicine.stock_quantity) > 0 && Number(medicine.stock_quantity) <= Number(medicine.min_stock_level));
  const outOfStock = medicines.filter((medicine) => Number(medicine.stock_quantity) === 0);
  
  const filteredMedicines = medicines.filter((medicine) => {
     if (filterOption === 'LOW_STOCK') return Number(medicine.stock_quantity) > 0 && Number(medicine.stock_quantity) <= Number(medicine.min_stock_level);
     if (filterOption === 'OUT_OF_STOCK') return Number(medicine.stock_quantity) === 0;
     return true;
  }).filter((medicine) => 
     medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     (medicine.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    { title: 'Total Medicines', value: medicines.length, icon: Package, color: 'bg-amber-50 text-amber-600 border border-amber-100' },
    { title: 'Low Stock Alerts', value: lowStock.length, icon: AlertTriangle, color: 'bg-orange-50 text-orange-600 border border-orange-100' },
    { title: 'Orders Today', value: stats.ordersToday, icon: ClipboardList, color: 'bg-blue-50 text-blue-600 border border-blue-100' },
    { title: 'Revenue Today', value: `$${stats.revenue.toFixed(2)}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  ];

  return (
    <PharmacyLayout title="Pharmacy Control">
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" /></div>
      ) : (
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-xl sm:px-8" style={{ backgroundImage: "linear-gradient(90deg, rgba(15,23,42,.95), rgba(15,23,42,.72)), url('/images/healthcare-team-hero.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300"><Boxes className="h-4 w-4" /> Clinical inventory</p>
                <h2 className="text-2xl font-extrabold">Keep every prescription moving.</h2>
                <p className="mt-2 max-w-xl text-sm text-slate-300">Monitor stock levels and prepare medicine orders issued through digital prescriptions.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/pharmacy/orders" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/20"><ClipboardList className="h-4 w-4" /> Prescription Orders</Link>
              </div>
            </div>
          </section>

          {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}><X className="h-4 w-4" /></button></div>}

          {lowStock.length > 0 && (
            <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
                <h3 className="text-lg font-bold text-red-900">Low Stock Alerts</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStock.map((medicine) => (
                  <div key={medicine.id} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{medicine.name}</p>
                      <p className="text-sm text-slate-500">Min level: {medicine.min_stock_level}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        {medicine.stock_quantity} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            {statCards.map((stat, index) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-xl ${stat.color} flex items-center justify-center`}><stat.icon className="w-7 h-7" /></div>
                <div><p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p><h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3></div>
              </motion.div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-8 mt-4 mb-4">
             <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Stock Status Distribution</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Adequate Stock', value: medicines.length - lowStock.length - outOfStock.length },
                          { name: 'Low Stock', value: lowStock.length },
                          { name: 'Out of Stock', value: outOfStock.length }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={5}
                      >
                        {
                          [0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))
                        }
                      </Pie>
                      <Tooltip cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3 3" }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Top Selling Medicines</h3>
                {stats.topSellers && stats.topSellers.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.topSellers} layout="vertical" margin={{ left: 20 }}>
                        <defs>
                          <linearGradient id="colorPharmBar" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} />
                          <Tooltip cursor={{ fill: '#f8fafc', stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3 3" }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#10b981' }} />
                        <Bar dataKey="count" fill="url(#colorPharmBar)" radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                     <p className="text-slate-500">No sales data available yet.</p>
                  </div>
                )}
             </div>
             
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
                <div className="flex flex-col mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Medicine Orders (Live)</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5"><div className="w-4 h-1 bg-emerald-500 rounded-full"></div><span className="text-xs text-slate-500 font-bold">Orders</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-4 h-1 bg-blue-500 rounded-full"></div><span className="text-xs text-slate-500 font-bold">Moving Avg</span></div>
                  </div>
                </div>
                {stats.orderTrends ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={(() => {
                        const dates = [];
                        for (let i = 6; i >= 0; i--) {
                          const d = new Date();
                          d.setDate(d.getDate() - i);
                          dates.push(d);
                        }
                        const padded = dates.map(d => {
                          const dateStr = d.toDateString();
                          const found = (stats.orderTrends || []).find(v => new Date(v.date).toDateString() === dateStr);
                          return { date: d.toISOString(), count: found ? found.count : 0 };
                        });
                        return padded.map((d, i, arr) => {
                          const slice = arr.slice(Math.max(0, i-2), i+1);
                          const avg = slice.reduce((sum, item) => sum + item.count, 0) / slice.length;
                          return { ...d, avg: Number(avg.toFixed(1)) };
                        });
                      })()}>
                        <defs>
                          <linearGradient id="colorPharmDaily" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8" 
                          tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
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
                          name="Orders"
                          stroke="#10b981" 
                          fill="url(#colorPharmDaily)" 
                          strokeWidth={2} 
                          activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                          isAnimationActive={true} 
                          animationDuration={1500} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="avg" 
                          name="Moving Avg"
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          dot={false}
                          isAnimationActive={true} 
                          animationDuration={1500} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                     <p className="text-slate-500">No daily order data available.</p>
                  </div>
                )}
                
                {/* Match Bottom Stats from Image */}
                <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                  <div className="flex flex-col border-r border-slate-100 px-4">
                    <span className="text-xs font-bold text-slate-500 mb-1">Today's Orders</span>
                    <span className="text-2xl font-extrabold text-slate-900">{stats.ordersToday || 0}</span>
                    <span className="text-xs font-bold text-emerald-500 mt-1 flex items-center">↑ 12.4%</span>
                  </div>
                  <div className="flex flex-col border-r border-slate-100 px-4">
                    <span className="text-xs font-bold text-slate-500 mb-1">Pending</span>
                    <span className="text-2xl font-extrabold text-slate-900">{stats.pendingOrders || 0}</span>
                    <span className="text-xs font-bold text-emerald-500 mt-1 flex items-center">↑ 5.2%</span>
                  </div>
                  <div className="flex flex-col border-r border-slate-100 px-4">
                    <span className="text-xs font-bold text-slate-500 mb-1">Completed</span>
                    <span className="text-2xl font-extrabold text-slate-900">{(stats.ordersToday || 0) - (stats.pendingOrders || 0)}</span>
                    <span className="text-xs font-bold text-emerald-500 mt-1 flex items-center">↑ 18.8%</span>
                  </div>
                  <div className="flex flex-col px-4">
                    <span className="text-xs font-bold text-slate-500 mb-1">Cancelled</span>
                    <span className="text-2xl font-extrabold text-slate-900">0</span>
                    <span className="text-xs font-bold text-red-500 mt-1 flex items-center">↓ 2.1%</span>
                  </div>
                </div>
             </div>
          </div>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="text-lg font-bold text-slate-800">Current Inventory</h3><p className="mt-1 text-sm text-slate-500">Update quantities as deliveries and dispensing are recorded.</p></div>
              <div className="flex gap-3">
                 <button onClick={() => { setMedicineForm(emptyMedicine); setIsAddOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-400">
                   <Plus className="h-4 w-4" /> Add Medicine
                 </button>
                 <input type="text" placeholder="Search medicines..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-48 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                 <select value={filterOption} onChange={(e) => setFilterOption(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm bg-white">
                    <option value="ALL">All Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                 </select>
              </div>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left border-collapse"><thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-6 py-4 font-semibold text-sm text-slate-600">Medicine Name</th><th className="px-6 py-4 font-semibold text-sm text-slate-600">Category</th><th className="px-6 py-4 font-semibold text-sm text-slate-600">Stock</th><th className="px-6 py-4 font-semibold text-sm text-slate-600">Price</th><th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">
              {filteredMedicines.map((medicine) => <tr key={medicine.id} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4 font-bold text-slate-800">{medicine.name}</td><td className="px-6 py-4 text-slate-600">{medicine.category || 'General'}</td><td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${Number(medicine.stock_quantity) === 0 ? 'bg-red-100 text-red-700' : Number(medicine.stock_quantity) <= Number(medicine.min_stock_level) ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{medicine.stock_quantity} units</span></td><td className="px-6 py-4 text-slate-800 font-medium">${Number(medicine.unit_price).toFixed(2)}</td><td className="px-6 py-4 text-right"><button onClick={() => { setStockTarget(medicine); setStockForm({ quantity: 1, type: 'add' }); }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-50"><Pencil className="h-4 w-4" /> Update Stock</button></td></tr>)}
            </tbody></table></div>
          </section>
        </div>
      )}

      {stockTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><form onSubmit={handleStockUpdate} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-amber-700">Inventory adjustment</p><h2 className="text-xl font-extrabold text-slate-900">{stockTarget.name}</h2><p className="mt-1 text-sm text-slate-500">Current quantity: {stockTarget.stock_quantity} units</p></div><button type="button" aria-label="Close stock update" onClick={() => setStockTarget(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="grid grid-cols-2 gap-3"><label className={`cursor-pointer rounded-xl border p-3 text-sm font-bold ${stockForm.type === 'add' ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600'}`}><input className="sr-only" type="radio" name="stock-type" value="add" checked={stockForm.type === 'add'} onChange={(event) => setStockForm((current) => ({ ...current, type: event.target.value }))} />Receive stock</label><label className={`cursor-pointer rounded-xl border p-3 text-sm font-bold ${stockForm.type === 'subtract' ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-200 text-slate-600'}`}><input className="sr-only" type="radio" name="stock-type" value="subtract" checked={stockForm.type === 'subtract'} onChange={(event) => setStockForm((current) => ({ ...current, type: event.target.value }))} />Dispense stock</label></div><label className="mt-5 block text-sm font-bold text-slate-700">Quantity<input required min="1" step="1" type="number" value={stockForm.quantity} onChange={(event) => setStockForm((current) => ({ ...current, quantity: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-900 outline-none ring-primary-500 focus:ring-2" /></label><div className="mt-6 flex gap-3"><button type="button" onClick={() => setStockTarget(null)} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 hover:bg-slate-200">Cancel</button><button disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 font-bold text-white hover:bg-amber-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Update'}</button></div></form></div>}

      {isAddOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"><form onSubmit={handleAddMedicine} className="my-6 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-amber-700">New inventory item</p><h2 className="text-xl font-extrabold text-slate-900">Add Medicine</h2></div><button type="button" aria-label="Close" onClick={() => setIsAddOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="grid gap-4 sm:grid-cols-2">{[['name', 'Medicine name', 'text'], ['category', 'Category', 'text'], ['manufacturer', 'Manufacturer', 'text'], ['unit_price', 'Unit price', 'number'], ['stock_quantity', 'Opening stock', 'number'], ['min_stock_level', 'Low-stock level', 'number'], ['expiry_date', 'Expiry date', 'date']].map(([field, label, type]) => <label key={field} className={`block text-sm font-bold text-slate-700 ${field === 'name' ? 'sm:col-span-2' : ''}`}>{label}<input required={['name', 'unit_price', 'stock_quantity'].includes(field)} min={type === 'number' ? '0' : undefined} step={field === 'unit_price' ? '0.01' : undefined} type={type} value={medicineForm[field] || ''} onChange={(event) => setMedicineForm((current) => ({ ...current, [field]: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-900 outline-none ring-primary-500 focus:ring-2" /></label>)}</div><div className="mt-6 flex gap-3"><button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 hover:bg-slate-200">Cancel</button><button disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 font-bold text-white hover:bg-amber-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Add Medicine'}</button></div></form></div>}
    </PharmacyLayout>
  );
};

export default PharmacyDashboard;

