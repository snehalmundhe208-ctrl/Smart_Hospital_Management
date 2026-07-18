import React, { useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import { Menu } from 'lucide-react';
import NotificationsMenu from '../components/NotificationsMenu';

const DashboardLayout = ({ children, title }) => {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="md:ml-64 flex flex-col min-h-screen">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationsMenu />
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 relative">
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
  );
};

export default DashboardLayout;
