import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import axios from '../api/axios';
import { Package, AlertTriangle, TrendingUp, Plus, Pencil, ClipboardList, X, Save, Boxes, Image as ImageIcon, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const emptyMedicine = { name: '', category: '', manufacturer: '', unit_price: '', stock_quantity: '', min_stock_level: '', expiry_date: '' };
const emptyBanner = { title: '', subtitle: '', button_text: '', image_url: '', is_active: true, display_order: 0 };

const AdminMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockTarget, setStockTarget] = useState(null);
  const [stockForm, setStockForm] = useState({ quantity: 1, type: 'add' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [medicineForm, setMedicineForm] = useState(emptyMedicine);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState('ALL'); // ALL, LOW_STOCK, OUT_OF_STOCK

  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const [stats, setStats] = useState({ topSellers: [], ordersToday: 0, revenue: 0 });
  const [banners, setBanners] = useState([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState(emptyBanner);
  const [editingBanner, setEditingBanner] = useState(null);

  const fetchMedicines = async () => {
    try {
      const [medRes, statsRes, bannerRes] = await Promise.all([
        axios.get('/api/pharmacy/medicines', config),
        axios.get('/api/dashboard/stats', config),
        axios.get('/api/banners/admin', config).catch(() => ({ data: [] }))
      ]);
      setMedicines(medRes.data);
      setStats(statsRes.data);
      setBanners(bannerRes.data);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to load pharmacy inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMedicines(); }, []);

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
      if (editingMedicine) {
        const { data } = await axios.put(`/api/pharmacy/medicines/${editingMedicine.id}`, medicineForm, config);
        setMedicines((current) => current.map(m => m.id === data.id ? data : m).sort((a, b) => a.name.localeCompare(b.name)));
        setNotice(`${data.name} updated successfully.`);
      } else {
        const { data } = await axios.post('/api/pharmacy/medicines', medicineForm, config);
        setMedicines((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
        setNotice(`${data.name} added to inventory.`);
      }
      setMedicineForm(emptyMedicine);
      setEditingMedicine(null);
      setIsAddOpen(false);
      setIsEditOpen(false);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to save medicine.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;
    try {
      await axios.delete(`/api/pharmacy/medicines/${id}`, config);
      setMedicines((current) => current.filter(m => m.id !== id));
      setNotice('Medicine deleted successfully.');
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to delete medicine.');
    }
  };

  const handleBannerImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBannerForm(prev => ({ ...prev, image_url: data.url }));
    } catch (error) {
      setNotice('Failed to upload banner image.');
    }
  };

  const handleBannerSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingBanner) {
        const { data } = await axios.put(`/api/banners/${editingBanner.id}`, bannerForm, config);
        setBanners(banners.map(b => b.id === data.id ? data : b));
        setNotice('Banner updated successfully.');
      } else {
        const { data } = await axios.post('/api/banners', bannerForm, config);
        setBanners([...banners, data]);
        setNotice('Banner created successfully.');
      }
      setIsBannerModalOpen(false);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to save banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await axios.delete(`/api/banners/${id}`, config);
      setBanners(banners.filter(b => b.id !== id));
      setNotice('Banner deleted successfully.');
    } catch (error) {
      setNotice('Unable to delete banner.');
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
    <AdminLayout title="Pharmacy Inventory (Admin)">
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
                <button onClick={() => { setEditingBanner(null); setBannerForm(emptyBanner); setIsBannerModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/20"><ImageIcon className="h-4 w-4" /> Manage Banners</button>
                <Link to="/pharmacy/orders" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/20"><ClipboardList className="h-4 w-4" /> Prescription Orders</Link>
                <button onClick={() => { setEditingMedicine(null); setMedicineForm(emptyMedicine); setIsAddOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"><Plus className="h-4 w-4" /> Add Medicine</button>
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
                      <button 
                        onClick={() => { setStockTarget(medicine); setStockForm({ quantity: 1, type: 'add' }); }} 
                        className="block mt-2 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        Restock
                      </button>
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
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {
                          [0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))
                        }
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Top Selling Medicines</h3>
                {stats.topSellers && stats.topSellers.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.topSellers} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#10b981' }} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                     <p className="text-slate-500">No sales data available yet.</p>
                  </div>
                )}
             </div>
          </div>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm mb-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-indigo-500" /> Pharmacy Banners</h3><p className="mt-1 text-sm text-slate-500">Manage banners displayed to patients.</p></div>
              <button onClick={() => { setEditingBanner(null); setBannerForm(emptyBanner); setIsBannerModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add Banner</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <div key={banner.id} className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group">
                  <div className="h-32 bg-slate-100 relative overflow-hidden">
                    {banner.image_url ? (
                      <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon className="h-8 w-8" /></div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${banner.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="font-bold text-slate-800 truncate">{banner.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{banner.subtitle}</p>
                    <div className="mt-auto pt-4 flex gap-2">
                      <button onClick={() => { setEditingBanner(banner); setBannerForm(banner); setIsBannerModalOpen(true); }} className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"><Pencil className="h-3 w-3 inline-block mr-1" /> Edit</button>
                      <button onClick={() => handleDeleteBanner(banner.id)} className="flex-1 rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"><Trash2 className="h-3 w-3 inline-block mr-1" /> Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {banners.length === 0 && (
                 <div className="col-span-full py-8 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">No banners found. Create one to display on the patient portal.</div>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="text-lg font-bold text-slate-800">Current Inventory</h3><p className="mt-1 text-sm text-slate-500">Update quantities as deliveries and dispensing are recorded.</p></div>
              <div className="flex gap-3">
                 <input type="text" placeholder="Search medicines..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-48 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                 <select value={filterOption} onChange={(e) => setFilterOption(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm bg-white">
                    <option value="ALL">All Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                 </select>
              </div>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left border-collapse"><thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-6 py-4 font-semibold text-sm text-slate-600">Medicine Name</th><th className="px-6 py-4 font-semibold text-sm text-slate-600">Category</th><th className="px-6 py-4 font-semibold text-sm text-slate-600">Stock</th><th className="px-6 py-4 font-semibold text-sm text-slate-600">Price</th><th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">
              {filteredMedicines.map((medicine) => <tr key={medicine.id} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4 font-bold text-slate-800">{medicine.name}</td><td className="px-6 py-4 text-slate-600">{medicine.category || 'General'}</td><td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${Number(medicine.stock_quantity) === 0 ? 'bg-red-100 text-red-700' : Number(medicine.stock_quantity) <= Number(medicine.min_stock_level) ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{medicine.stock_quantity} units</span></td><td className="px-6 py-4 text-slate-800 font-medium">${Number(medicine.unit_price).toFixed(2)}</td><td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => { setStockTarget(medicine); setStockForm({ quantity: 1, type: 'add' }); }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-50" title="Update Stock"><Boxes className="h-4 w-4" /></button><button onClick={() => { setEditingMedicine(medicine); setMedicineForm(medicine); setIsEditOpen(true); }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100" title="Edit"><Pencil className="h-4 w-4" /></button><button onClick={() => handleDeleteMedicine(medicine.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button></td></tr>)}
            </tbody></table></div>
          </section>
        </div>
      )}

      {stockTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><form onSubmit={handleStockUpdate} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-amber-700">Inventory adjustment</p><h2 className="text-xl font-extrabold text-slate-900">{stockTarget.name}</h2><p className="mt-1 text-sm text-slate-500">Current quantity: {stockTarget.stock_quantity} units</p></div><button type="button" aria-label="Close stock update" onClick={() => setStockTarget(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="grid grid-cols-2 gap-3"><label className={`cursor-pointer rounded-xl border p-3 text-sm font-bold ${stockForm.type === 'add' ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600'}`}><input className="sr-only" type="radio" name="stock-type" value="add" checked={stockForm.type === 'add'} onChange={(event) => setStockForm((current) => ({ ...current, type: event.target.value }))} />Receive stock</label><label className={`cursor-pointer rounded-xl border p-3 text-sm font-bold ${stockForm.type === 'subtract' ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-200 text-slate-600'}`}><input className="sr-only" type="radio" name="stock-type" value="subtract" checked={stockForm.type === 'subtract'} onChange={(event) => setStockForm((current) => ({ ...current, type: event.target.value }))} />Dispense stock</label></div><label className="mt-5 block text-sm font-bold text-slate-700">Quantity<input required min="1" step="1" type="number" value={stockForm.quantity} onChange={(event) => setStockForm((current) => ({ ...current, quantity: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-900 outline-none ring-primary-500 focus:ring-2" /></label><div className="mt-6 flex gap-3"><button type="button" onClick={() => setStockTarget(null)} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 hover:bg-slate-200">Cancel</button><button disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 font-bold text-white hover:bg-amber-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save Update'}</button></div></form></div>}

      {(isAddOpen || isEditOpen) && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"><form onSubmit={handleAddMedicine} className="my-6 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-amber-700">{editingMedicine ? 'Update inventory item' : 'New inventory item'}</p><h2 className="text-xl font-extrabold text-slate-900">{editingMedicine ? 'Edit Medicine' : 'Add Medicine'}</h2></div><button type="button" aria-label="Close" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="grid gap-4 sm:grid-cols-2">{[['name', 'Medicine name', 'text'], ['category', 'Category', 'text'], ['manufacturer', 'Manufacturer', 'text'], ['unit_price', 'Unit price', 'number'], ['stock_quantity', 'Opening stock', 'number'], ['min_stock_level', 'Low-stock level', 'number'], ['expiry_date', 'Expiry date', 'date']].map(([field, label, type]) => <label key={field} className={`block text-sm font-bold text-slate-700 ${field === 'name' ? 'sm:col-span-2' : ''}`}>{label}<input required={['name', 'unit_price', 'stock_quantity'].includes(field)} min={type === 'number' ? '0' : undefined} step={field === 'unit_price' ? '0.01' : undefined} type={type} value={medicineForm[field] || ''} onChange={(event) => setMedicineForm((current) => ({ ...current, [field]: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-900 outline-none ring-primary-500 focus:ring-2" disabled={field === 'stock_quantity' && editingMedicine} /></label>)}</div><div className="mt-6 flex gap-3"><button type="button" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 hover:bg-slate-200">Cancel</button><button disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 font-bold text-white hover:bg-amber-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : (editingMedicine ? 'Update Medicine' : 'Add Medicine')}</button></div></form></div>}
      
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleBannerSubmit} className="my-6 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-600">Promotion & Display</p>
                <h2 className="text-xl font-extrabold text-slate-900">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h2>
              </div>
              <button type="button" onClick={() => setIsBannerModalOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Title
                <input required type="text" value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
              </label>
              <label className="block text-sm font-bold text-slate-700">Subtitle
                <input required type="text" value={bannerForm.subtitle} onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
              </label>
                <label className="block text-sm font-bold text-slate-700">Image Upload
                  <input type="file" accept="image/*" onChange={handleBannerImageUpload} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                  {bannerForm.image_url && <p className="mt-2 text-xs text-indigo-600">Current Image: {bannerForm.image_url}</p>}
                </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-bold text-slate-700">Button Text
                  <input type="text" value={bannerForm.button_text || ''} onChange={e => setBannerForm({...bannerForm, button_text: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </label>
                <label className="block text-sm font-bold text-slate-700">Display Order
                  <input type="number" min="0" value={bannerForm.display_order} onChange={e => setBannerForm({...bannerForm, display_order: parseInt(e.target.value)})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </label>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={bannerForm.is_active} onChange={e => setBannerForm({...bannerForm, is_active: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                Banner is Active
              </label>
            </div>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setIsBannerModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 hover:bg-slate-200">Cancel</button>
              <button disabled={saving} className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save Banner'}</button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMedicines;
