import React, { useState, useEffect } from 'react';
import PatientLayout from '../layouts/PatientLayout';
import axios from '../api/axios';
import { motion } from 'framer-motion';
import { FileText, Pill, FlaskConical } from 'lucide-react';

const PatientProfile = () => {
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        
        const { data: appts } = await axios.get('/api/appointments', config);
        setAppointments(appts);

        const { data: rxList } = await axios.get('/api/prescriptions', config);
        setPrescriptions(rxList);

        const { data: labList } = await axios.get('/api/lab/requests', config);
        setLabRequests(labList);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const upcoming = appointments.filter(a => ['PENDING','CONFIRMED'].includes(a.status));
  const past     = appointments.filter(a => ['COMPLETED','CANCELLED'].includes(a.status));

  return (
    <PatientLayout title="My Health Profile">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Quick stats */}
        <div className="space-y-4">
          {[
            { label: 'Total Visits', value: appointments.length, icon: FileText, color: 'bg-blue-50 text-blue-600 border border-blue-100' },
            { label: 'Prescriptions', value: prescriptions.length, icon: Pill, color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
            { label: 'Lab Reports', value: labRequests.length, icon: FlaskConical, color: 'bg-purple-50 text-purple-600 border border-purple-100' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">{s.label}</p>
                <p className="text-2xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </motion.div>
          ))}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-5 rounded-2xl shadow-lg shadow-emerald-500/20">
            <p className="text-sm font-semibold opacity-80 mb-1">Book Next Appointment</p>
            <p className="text-xs opacity-60 mb-4">Connect with a specialist today</p>
            <a href="/patient/book-appointment">
              <button className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white py-2 rounded-xl font-bold text-sm transition-all">
                Book Now →
              </button>
            </a>
          </motion.div>
        </div>

        {/* Right: Appointment history */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Upcoming Appointments</h3>
            </div>
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              </div>
            ) : upcoming.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-slate-500 text-sm">No upcoming appointments</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcoming.map(apt => (
                  <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                        {apt.doctor_first_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Dr. {apt.doctor_first_name} {apt.doctor_last_name}</p>
                        <p className="text-xs text-slate-400">{new Date(apt.appointment_date).toDateString()} · {apt.appointment_time}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>{apt.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Past Visits</h3>
            </div>
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              </div>
            ) : past.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-slate-500 text-sm">No past visits</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {past.map(apt => (
                  <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {apt.doctor_first_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm">Dr. {apt.doctor_first_name} {apt.doctor_last_name}</p>
                        <p className="text-xs text-slate-400">{new Date(apt.appointment_date).toDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{apt.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientProfile;
