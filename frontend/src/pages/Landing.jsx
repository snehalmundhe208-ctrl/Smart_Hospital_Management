import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Users, ArrowRight, HeartPulse, Stethoscope, PhoneCall, Star, Ambulance, Siren, Flame, Droplet, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const fallbackTestimonials = [
  { rating: 5, review: 'Amazing service and care. The doctors are very attentive!', first_name: 'Happy', last_name: 'Patient' },
];

const normalizeTestimonials = (payload) => {
  if (Array.isArray(payload)) {
    return payload.filter(Boolean).length > 0 ? payload.filter(Boolean) : fallbackTestimonials;
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) {
      return payload.data.filter(Boolean).length > 0 ? payload.data.filter(Boolean) : fallbackTestimonials;
    }

    if (Array.isArray(payload.testimonials)) {
      return payload.testimonials.filter(Boolean).length > 0 ? payload.testimonials.filter(Boolean) : fallbackTestimonials;
    }

    if (payload.review || payload.rating || payload.first_name || payload.last_name) {
      return [payload];
    }
  }

  if (payload === null || payload === undefined || payload === '') {
    return fallbackTestimonials;
  }

  return fallbackTestimonials;
};

const Landing = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await axios.get('/api/feedback/public');
        const payload = response?.data;
        setTestimonials(normalizeTestimonials(payload));
      } catch (error) {
        console.error(error);
        setTestimonials(fallbackTestimonials);
      }
    };

    fetchTestimonials();
  }, []);

  const visibleTestimonials = Array.isArray(testimonials) ? testimonials : fallbackTestimonials;
  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden">
      {/* Navigation - Glassmorphism */}
      <nav className="fixed w-full z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Activity className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                NovaCare
              </span>
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#services" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Services</a>
              <a href="#doctors" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Our Doctors</a>
              <a href="#testimonials" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Testimonials</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">Sign In</Link>
              <Link to="/register">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-full font-medium shadow-lg shadow-primary-500/30 transition-colors"
                >
                  Book Appointment
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900 flex items-center min-h-[85vh]">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-top bg-no-repeat"
          style={{ backgroundImage: `url('/hero-bg.png')` }}
        />
        {/* Subtle Dark Overlay */}
        <div className="absolute inset-0 bg-teal-900/40 z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white font-medium text-sm mb-6 backdrop-blur-md border border-white/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                24/7 Emergency Care Available
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
                Smart Healthcare <br />
                <span className="text-blue-300">
                  For Every Life.
                </span>
              </h1>
              <p className="text-xl text-slate-100 mb-8 leading-relaxed font-medium drop-shadow-md">
                Experience the future of medical care with our advanced hospital management platform. Compassion meets cutting-edge technology to prioritize your health.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 transition-all"
                  >
                    Get Started <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <motion.a
                  href="#emergency"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white backdrop-blur-md px-8 py-4 rounded-full font-bold text-lg border border-white/30 shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <PhoneCall className="w-5 h-5" />
                  Emergency SOS
                </motion.a>
              </div>
            </motion.div>

            {/* Right side floating graphics */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block h-[600px]"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-primary-900/50 to-blue-900/30 flex items-center justify-center relative shadow-2xl shadow-primary-900/50 backdrop-blur-3xl border border-white/10">
                    <HeartPulse className="w-48 h-48 text-primary-500 opacity-20 absolute" />
                    
                    {/* Floating Cards */}
                    <motion.div 
                      animate={{ y: [-10, 10, -10] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -left-10 top-20 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Users className="text-green-400 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold">Active Patients</p>
                        <p className="text-lg font-bold text-white">12,450+</p>
                      </div>
                    </motion.div>

                    <motion.div 
                      animate={{ y: [10, -10, 10] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -right-5 bottom-32 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Stethoscope className="text-blue-400 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold">Specialist Doctors</p>
                        <p className="text-lg font-bold text-white">150+</p>
                      </div>
                    </motion.div>

                    <motion.div 
                      animate={{ y: [-5, 15, -5] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-1/2 -bottom-10 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 w-64"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Shield className="text-amber-400 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold">Secure Records</p>
                        <p className="text-sm font-bold text-white">100% Data Privacy</p>
                      </div>
                    </motion.div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Emergency Section */}
      <div id="emergency" className="py-16 bg-slate-50 relative -mt-10 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 lg:p-12 border border-slate-100">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-3">
                <Siren className="w-8 h-8 text-rose-600 animate-pulse" />
                Emergency Quick Access
              </h2>
              <p className="text-slate-500 mt-2">Tap any number below to call immediately.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'National Emergency', number: '112', raw: '112', icon: PhoneCall, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
                { name: 'Ambulance', number: '108', raw: '108', icon: Ambulance, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
                { name: 'Police', number: '100', raw: '100', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                { name: 'Fire Brigade', number: '101', raw: '101', icon: Flame, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                { name: 'Blood Bank', number: '104', raw: '104', icon: Droplet, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
                { name: 'Health Helpline', number: '1075', raw: '1075', icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              ].map((contact, idx) => (
                <a 
                  key={idx}
                  href={`tel:${contact.raw}`}
                  className={`flex items-center gap-5 p-5 rounded-2xl border ${contact.border} hover:shadow-lg transition-all group bg-white hover:-translate-y-1 cursor-pointer`}
                >
                  <div className={`w-14 h-14 rounded-full ${contact.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <contact.icon className={`w-7 h-7 ${contact.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{contact.name}</p>
                    <p className="text-xl font-extrabold text-slate-800 group-hover:text-primary-600 transition-colors">{contact.number}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div id="services" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Comprehensive Care Solutions</h2>
            <p className="text-slate-600 text-lg">Integrated hospital management connecting patients, doctors, and staff seamlessly.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Digital Appointments', desc: 'Book and manage appointments instantly with real-time slot availability.', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
              { title: 'E-Prescriptions', desc: 'Secure digital prescriptions sent directly to your pharmacy app.', icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-50' },
              { title: 'Lab Integrations', desc: 'Access your medical test reports digitally as soon as they are ready.', icon: Shield, color: 'text-primary-600', bg: 'bg-primary-50' },
            ].map((service, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group"
              >
                <div className={`w-16 h-16 rounded-2xl ${service.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <service.icon className={`w-8 h-8 ${service.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                <p className="text-slate-600 leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Doctors Section Placeholder */}
      <div id="doctors" className="py-24 bg-slate-50 relative border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Meet Our Specialists</h2>
          <p className="text-slate-600 text-lg mb-12">Expert doctors dedicated to providing the best healthcare.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Meena Verma', specialty: 'Neurology', image: '/images/profiles/doctor-01.jpg' },
              { name: 'Arjun Kapoor', specialty: 'Cardiology', image: '/images/profiles/doctor-02.jpg' },
              { name: 'Kavitha Rao', specialty: 'Pediatrics', image: '/images/profiles/clinician-01.jpg' },
              { name: 'Vikram Singh', specialty: 'Surgery', image: '/images/profiles/staff-01.jpg' },
            ].map((doctor) => (
              <div key={doctor.name} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <img src={doctor.image} alt={`Dr. ${doctor.name}`} className="w-24 h-24 mx-auto object-cover rounded-full mb-4 ring-4 ring-primary-50" />
                <h3 className="font-bold text-slate-800">Dr. {doctor.name}</h3>
                <p className="text-sm text-primary-600">{doctor.specialty}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section Placeholder */}
      <div id="testimonials" className="py-24 bg-white relative border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Patient Stories</h2>
          <p className="text-slate-600 text-lg mb-12">Hear what our patients have to say about NovaCare.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {visibleTestimonials.map((t, index) => (
              <div key={index} className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                <div className="flex text-amber-400 mb-4 justify-center gap-1">
                  {Array.from({ length: t?.rating || 5 }, (_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-600 italic mb-4">"{t?.review || 'Exceptional care and a smooth experience from start to finish.'}"</p>
                <h4 className="font-bold text-slate-800">- {t?.first_name || 'Happy'} {t?.last_name || 'Patient'}</h4>
                {t?.doctor_first_name && <p className="text-xs text-slate-400 mt-1">Treated by Dr. {t.doctor_first_name}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Placeholder */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-slate-400">© 2026 NovaCare Smart Hospital Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
