import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Bell, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationsMenu = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.get('/api/notifications', config);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put(`/api/notifications/${id}/read`, {}, config);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-primary-100 text-primary-700 font-bold px-2 py-1 rounded-full">{unreadCount} New</span>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map(notif => (
                    <div key={notif.id} className={`p-4 hover:bg-slate-50 transition-colors flex gap-3 ${!notif.is_read ? 'bg-primary-50/30' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          notif.type === 'APPOINTMENT' ? 'bg-blue-100 text-blue-600' :
                          notif.type === 'LAB' ? 'bg-purple-100 text-purple-600' :
                          'bg-slate-100 text-slate-600'
                      }`}>
                          <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.is_read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                      </div>
                      {!notif.is_read && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="w-6 h-6 rounded-full hover:bg-green-100 text-slate-400 hover:text-green-600 flex items-center justify-center transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsMenu;
