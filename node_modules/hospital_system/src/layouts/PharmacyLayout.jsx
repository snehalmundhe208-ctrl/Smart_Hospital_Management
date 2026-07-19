import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Activity, LayoutDashboard, Menu, ShieldAlert, ClipboardList, BookOpen, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationsMenu from '../components/NotificationsMenu';
import axios from 'axios';
import ProfileAvatar from '../components/ProfileAvatar';

const PharmacyLayout = ({ children, title }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const { data } = await axios.get('/api/pharmacy/medicines', config);
        const lowStock = data.filter(m => m.stock_quantity <= m.min_stock_level).length;
        setLowStockCount(lowStock);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMeds();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { name: 'Inventory & Stock', path: '/pharmacy', icon: LayoutDashboard },
    { name: 'Prescription Orders', path: '/pharmacy/orders', icon: ClipboardList },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-transparent text-slate-800">
      <div className="h-20 flex items-center px-6 border-b border-white/40">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-400 flex items-center justify-center mr-3 shadow-md shadow-amber-500/20">
          <Activity className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-slate-800">NovaCare <span className="text-xs bg-amber-600 text-white px-1.5 py-0.5 rounded font-mono ml-1">Rx</span></span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {links.map((link, idx) => (
          <NavLink
            key={idx}
            to={link.path}
            end
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-amber-500/20 text-amber-800 font-bold backdrop-blur-md shadow-sm' 
                  : 'text-slate-700 hover:bg-white/40 hover:text-amber-900'
              }`
            }
          >
            <link.icon className="w-5 h-5 mr-3" />
            {link.name}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-white/40 bg-white/10 backdrop-blur-md">
        <div className="flex items-center mb-4 px-2">
          <ProfileAvatar user={user} className="w-10 h-10 mr-3" fallbackClassName="bg-amber-100 text-amber-800" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <NavLink
          to="/pharmacy/profile"
          onClick={() => setIsMobileOpen(false)}
          className={({ isActive }) => 
            `flex items-center w-full px-4 py-2.5 mb-2 text-sm font-medium rounded-xl transition-all duration-200 ${
              isActive 
                ? 'bg-amber-500/20 text-amber-800 font-bold backdrop-blur-md shadow-sm' 
                : 'text-slate-700 hover:bg-white/40 hover:text-amber-900'
            }`
          }
        >
          <Users className="w-4 h-4 mr-3" />
          Edit Profile
        </NavLink>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </motion.button>
      </div>
    </div>
  );

  return (
    <div 
      className="min-h-screen bg-slate-50 bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url('/images/bg/pharmacy-bg.jpg')` }}
    >
      {/* Light Overlay */}
      <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] pointer-events-none z-0"></div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex min-h-screen">
        
        {/* Desktop Sidebar */}
        <div className="w-64 fixed inset-y-0 left-0 z-40 hidden md:flex flex-col border-r border-white/40 bg-white/50 backdrop-blur-2xl shadow-xl">
          <SidebarContent />
        </div>

        {/* Mobile Drawer */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} className="relative w-64 h-full z-10 bg-white/80 backdrop-blur-2xl border-r border-white/40">
              <SidebarContent />
            </motion.div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0">
          <header className="h-20 bg-white/40 backdrop-blur-xl border-b border-white/40 sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMobileOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-white/50 rounded-lg">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-extrabold text-slate-800">{title}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <NotificationsMenu />
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              {lowStockCount > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/20 shadow-sm hidden sm:flex">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">
                    {lowStockCount} Items Low Stock
                  </span>
                </div>
              )}
            </div>
          </header>

        <main className="flex-1 p-6 lg:p-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PharmacyLayout;

