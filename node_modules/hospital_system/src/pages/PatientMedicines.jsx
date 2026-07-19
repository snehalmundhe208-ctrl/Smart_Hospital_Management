import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import PatientLayout from '../layouts/PatientLayout';
import { Search, ShoppingCart, Plus, Minus, X, CreditCard, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadInvoiceReceipt } from '../utils/exportUtils';

const PatientMedicines = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const { data } = await axios.get('/api/pharmacy/medicines', config);
        setMedicines(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
    
    const fetchBanners = async () => {
      try {
        const { data } = await axios.get('/api/banners');
        setBanners(data);
      } catch (err) {
        console.error('Error fetching banners:', err);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const addToCart = (med) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === med.id);
      if (existing) {
        if (existing.quantity >= med.stock_quantity) return prev;
        return prev.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...med, quantity: 1 }];
    });
    setNotice(`${med.name} added to cart`);
    setTimeout(() => setNotice(''), 3000);
  };

  const updateCartQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.stock_quantity) return { ...item, quantity: newQ };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    setBusy(true);
    try {
      const items = cart.map(item => ({ medicine_id: item.id, quantity: item.quantity }));
      const { data } = await axios.post('/api/pharmacy/store-orders', { items, payment_method: paymentMethod }, config);
      if (data.invoice) {
        try {
          console.log('Invoice data before PDF generation:', data.invoice);
          await downloadInvoiceReceipt(data.invoice, user);
          console.log('PDF saved successfully');
        } catch (pdfErr) {
          console.error('Failed to download PDF receipt:', pdfErr);
          console.error(pdfErr.stack);
        }
      }
      setCart([]);
      setNotice('Payment successful! Order placed.');
      setIsCheckoutOpen(false);
      setTimeout(() => navigate('/patient/medicine-orders'), 1600);
    } catch (err) {
      setNotice(err.response?.data?.message || 'Failed to place order');
    } finally {
      setBusy(false);
    }
  };

  const filteredMedicines = medicines.filter(med => 
    (category === 'ALL' || med.category === category) &&
    med.name.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['ALL', ...new Set(medicines.map(m => m.category).filter(Boolean))];

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.unit_price) * item.quantity), 0);

  return (
    <PatientLayout title="Pharmacy Store">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-2xl font-extrabold text-slate-800">Pharmacy Store</h2>
           <p className="text-slate-500">Order medicines online.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <Link to="/patient/medicine-orders" className="text-sm font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-4 py-2.5 rounded-xl transition-colors">
              My Order History
           </Link>
           <button 
             onClick={() => setIsCartOpen(true)}
             className="relative bg-white border border-slate-200 p-2.5 rounded-xl text-slate-700 shadow-sm hover:shadow-md transition-shadow"
           >
             <ShoppingCart className="w-5 h-5" />
             {cart.length > 0 && (
               <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                 {cart.length}
               </span>
             )}
           </button>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl mb-6 flex items-start gap-3">
        <div className="mt-0.5"><ShoppingBag size={16} /></div>
        <p><strong>Tracking Orders:</strong> Once placed, you can track your order status (PENDING, PROCESSING, READY, DELIVERED) from the "My Order History" section. Payment is collected at the pharmacy counter or added to your hospital bill.</p>
      </div>

      {notice && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl font-semibold border border-green-200">
          {notice}
        </div>
      )}

      {banners.length > 0 && (
        <div className="relative h-[250px] md:h-[350px] w-full mb-8 rounded-3xl overflow-hidden shadow-sm group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <img src={banners[currentBanner].image_url} alt="Pharmacy Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center">
                <div className="px-8 md:px-16 max-w-2xl text-white">
                  <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                    {banners[currentBanner].title}
                  </motion.h2>
                  {banners[currentBanner].subtitle && (
                    <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-lg md:text-xl text-slate-200 mb-6 font-medium">
                      {banners[currentBanner].subtitle}
                    </motion.p>
                  )}
                  {banners[currentBanner].button_text && (
                    <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-colors">
                      {banners[currentBanner].button_text}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBanner(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentBanner ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
           <input 
             type="text" 
             placeholder="Search medicines..." 
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500"
           />
         </div>
         <select 
           value={category} 
           onChange={e => setCategory(e.target.value)}
           className="px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
         >
           {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
         </select>
      </div>

      {loading ? (
        <div className="flex justify-center h-64 items-center">
          <div className="animate-spin w-10 h-10 border-b-2 border-primary-600 rounded-full" />
        </div>
      ) : filteredMedicines.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
           <ShoppingBag className="w-16 h-16 mx-auto text-slate-300 mb-4" />
           <p className="text-lg">No medicines found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMedicines.map((med, i) => (
            <motion.div 
              key={med.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="h-40 bg-slate-50 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
                 {med.image_url ? (
                   <img src={med.image_url} alt={med.name} className="w-full h-full object-cover" />
                 ) : (
                   <ShoppingBag className="w-12 h-12 text-slate-300" />
                 )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{med.category || 'General'}</p>
                <h3 className="font-extrabold text-slate-900 text-lg">{med.name}</h3>
                <p className="text-sm text-slate-500 mb-2">{med.manufacturer}</p>
                <p className="font-bold text-primary-700 text-xl">${Number(med.unit_price).toFixed(2)}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-xs font-bold ${med.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {med.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
                <button 
                  disabled={med.stock_quantity === 0}
                  onClick={() => addToCart(med)}
                  className="bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
           <motion.div 
             initial={{ x: '100%' }}
             animate={{ x: 0 }}
             className="w-full max-w-md bg-white h-full relative z-10 flex flex-col shadow-2xl"
           >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                   <ShoppingCart className="w-6 h-6 text-primary-600" /> Your Cart
                 </h2>
                 <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center text-slate-500 mt-20">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 bg-white border border-slate-100 shadow-sm rounded-2xl items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center">
                         {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-xl" /> : <ShoppingBag className="w-8 h-8 text-slate-300" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{item.name}</h4>
                        <p className="text-sm font-semibold text-primary-600">${Number(item.unit_price).toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-100">
                           <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 text-slate-500 hover:text-slate-800"><Minus className="w-4 h-4" /></button>
                           <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                           <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 text-slate-500 hover:text-slate-800"><Plus className="w-4 h-4" /></button>
                         </div>
                         <button onClick={() => removeFromCart(item.id)} className="text-[10px] text-red-500 hover:underline">Remove</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-white">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-slate-500">Total Amount</span>
                    <span className="text-2xl font-extrabold text-slate-900">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition flex items-center justify-center gap-2"
                  >
                    Proceed to Checkout <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
           </motion.div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">Checkout</h3>
                  <p className="text-sm text-slate-500 mt-1">{cart.length} items</p>
               </div>
               <button onClick={() => setIsCheckoutOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6 mb-6 text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-primary-700 mb-1">Amount to Pay</p>
              <p className="text-4xl font-extrabold text-primary-900">${cartTotal.toFixed(2)}</p>
            </div>
            
            <label className="block text-sm font-bold text-slate-700 mb-2">Payment Method</label>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)} 
              className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white mb-8 font-semibold"
            >
              <option value="UPI">UPI</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="NET_BANKING">Net Banking</option>
            </select>
            
            <button 
              disabled={busy} 
              onClick={handleCheckout} 
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-4 font-bold text-white hover:bg-slate-800 disabled:opacity-70 transition shadow-lg shadow-slate-900/20"
            >
              <CreditCard className="w-5 h-5" />
              {busy ? 'Processing...' : 'Pay & Place Order'}
            </button>
          </div>
        </div>
      )}
    </PatientLayout>
  );
};

export default PatientMedicines;
