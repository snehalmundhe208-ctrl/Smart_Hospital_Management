import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Activity, Users, Calendar, LayoutDashboard, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinks = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { name: 'Dashboard',    path: '/admin',          icon: LayoutDashboard },
          { name: 'Patients',     path: '/admin/patients', icon: Users },
          { name: 'Doctors',      path: '/admin/doctors',  icon: Activity },
          { name: 'Appointments', path: '/admin/appointments', icon: Calendar },
          { name: 'Settings',     path: '/admin/settings', icon: Settings },
        ];
      case 'DOCTOR':
        return [
          { name: 'Dashboard', path: '/doctor', icon: LayoutDashboard },
          { name: 'Appointments', path: '/doctor/appointments', icon: Calendar },
          { name: 'Patients', path: '/doctor/patients', icon: Users },
        ];
      case 'PATIENT':
        return [
          { name: 'Dashboard',       path: '/patient',                  icon: LayoutDashboard },
          { name: 'My Profile',      path: '/patient/profile',          icon: Users },
          { name: 'My Appointments', path: '/patient/appointments',     icon: Calendar },
          { name: 'Book Appointment',path: '/patient/book-appointment', icon: Activity },
        ];
      case 'RECEPTIONIST':
        return [
          { name: 'Dashboard', path: '/reception', icon: LayoutDashboard },
          { name: 'Appointments', path: '/reception/appointments', icon: Calendar },
        ];
      case 'PHARMACY':
        return [
          { name: 'Inventory', path: '/pharmacy', icon: LayoutDashboard },
        ];
      case 'LAB':
        return [
          { name: 'Lab Requests', path: '/lab', icon: LayoutDashboard },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col shadow-sm hidden md:flex fixed top-0 left-0 z-10">
      <div className="h-20 flex items-center px-6 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center mr-3 shadow-md shadow-primary-500/20">
          <Activity className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-slate-800">NovaCare</span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {links.map((link, idx) => (
          <NavLink
            key={idx}
            to={link.path}
            end
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <link.icon className="w-5 h-5 mr-3" />
            {link.name}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3">
            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
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
};

export default Sidebar;
