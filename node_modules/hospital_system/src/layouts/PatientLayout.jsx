import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Activity, Calendar, Users, Menu, Heart, QrCode, ShoppingBag, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationsMenu from '../components/NotificationsMenu';
import ProfileAvatar from '../components/ProfileAvatar';

const PatientLayout = ({ children, title }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { name: 'Dashboard',       path: '/patient',                  icon: Heart },
    { name: 'Medical Profile',  path: '/patient/health-profile',          icon: Users },
    { name: 'My Appointments', path: '/patient/appointments',     icon: Calendar },
    { name: 'Book Appointment',path: '/patient/book-appointment', icon: Activity },
    { name: 'Order Medicines',  path: '/patient/medicines',        icon: ShoppingBag },
    { name: 'Help & Guide',    path: '/help',                     icon: BookOpen },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-transparent text-slate-800">
      <div className="h-20 flex items-center px-6 border-b border-white/40">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mr-3 shadow-md shadow-emerald-500/20">
          <Activity className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-slate-800">NovaCare</span>
      </div>

      {/* Patient Health ID Card Quick View */}
      <div className="p-4 mx-4 my-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-6 -mt-6"></div>
        <div className="relative z-10">
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-75">Digital Patient Pass</p>
          <p className="font-extrabold text-sm mt-1 truncate">{user?.first_name} {user?.last_name}</p>
          <p className="text-[10px] font-mono opacity-80 mt-0.5">ID: {user?.patient_id || 'PAT-301294'}</p>
          
          <button 
            onClick={() => setShowIdCard(true)}
            className="mt-3 w-full bg-white/20 hover:bg-white/30 border border-white/20 rounded-xl py-1.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" /> Show Health QR Card
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-4 space-y-1">
        {links.map((link, idx) => (
          <NavLink
            key={idx}
            to={link.path}
            end
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-500/20 text-emerald-800 font-bold backdrop-blur-md shadow-sm' 
                  : 'text-slate-700 hover:bg-white/40 hover:text-emerald-900'
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
          <ProfileAvatar user={user} className="w-10 h-10 mr-3" fallbackClassName="bg-emerald-100 text-emerald-800" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <NavLink
          to="/patient/profile"
          onClick={() => setIsMobileOpen(false)}
          className={({ isActive }) => 
            `flex items-center w-full px-4 py-2.5 mb-2 text-sm font-medium rounded-xl transition-all duration-200 ${
              isActive 
                ? 'bg-emerald-500/20 text-emerald-800 font-bold backdrop-blur-md shadow-sm' 
                : 'text-slate-700 hover:bg-white/40 hover:text-emerald-900'
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
      style={{ backgroundImage: `url('/images/bg/patient-bg.jpg')` }}
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
              <span className="text-xs text-emerald-800 bg-emerald-500/10 px-3 py-1.5 rounded-full font-semibold border border-emerald-500/20 backdrop-blur-md hidden sm:block">
                Insurance: Active (NovaHealth Co.)
              </span>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-10 text-slate-800 overflow-x-hidden">
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

      {/* QR Code ID Modal */}
      <AnimatePresence>
        {showIdCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl flex flex-col items-center"
            >
              <div className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white text-center shadow-lg relative overflow-hidden mb-6">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-6 -mt-6"></div>
                <h3 className="font-extrabold text-lg">NovaCare Health System</h3>
                <p className="text-xs opacity-80 mt-1">Official Digital Health ID</p>
                <ProfileAvatar user={user} className="w-20 h-20 mx-auto my-4 ring-2 ring-white/40" fallbackClassName="bg-white/20 text-white text-3xl" />
                <h4 className="font-bold text-base">{user?.first_name} {user?.last_name}</h4>
                <p className="text-xs opacity-75 font-mono mt-1">Patient ID: {user?.patient_id || 'PAT-301294'}</p>
              </div>

              {/* QR Code Representation */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6 shadow-inner flex flex-col items-center justify-center">
                <svg className="w-40 h-40 text-slate-800" viewBox="0 0 100 100">
                  <path fill="currentColor" d="M5,5 h30 v30 h-30 z M15,15 h10 v10 h-10 z M65,5 h30 v30 h-30 z M75,15 h10 v10 h-10 z M5,65 h30 v30 h-30 z M15,75 h10 v10 h-10 z M45,45 h10 v10 h-10 z M45,5 h10 v10 h-10 z M5,45 h10 v10 h-10 z M45,25 h10 v10 h-10 z M25,45 h10 v10 h-10 z M65,45 h10 v10 h-10 z M45,65 h10 v10 h-10 z M65,65 h10 v10 h-10 z M85,45 h10 v10 h-10 z M85,65 h10 v10 h-10 z M45,85 h10 v10 h-10 z M65,85 h10 v10 h-10 z M85,85 h10 v10 h-10 z" />
                </svg>
                <p className="text-[10px] text-slate-400 font-mono mt-3">Scan at Reception/Doctor Desk</p>
              </div>

              <button 
                onClick={() => setShowIdCard(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-all"
              >
                Close ID Pass
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientLayout;
