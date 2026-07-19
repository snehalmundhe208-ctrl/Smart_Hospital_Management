import React, { useState, useContext, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, BookOpen, UserPlus, Calendar, CreditCard, 
  RotateCcw, FileText, Pill, Truck, Bell, HelpCircle, 
  Phone, ArrowLeft, Mail, MapPin, Search, Activity, Heart, ArrowRight
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const GUIDE_SECTIONS = [
  {
    id: 'auth',
    title: 'Registration & Login',
    icon: UserPlus,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    content: (
      <div className="space-y-4 text-slate-600 text-sm">
        <p><strong>To Register:</strong> Click on the "Sign Up" button on the homepage. Fill in your personal details, choose a strong password, and select your role (e.g., Patient). You will be logged in immediately after successful registration.</p>
        <p><strong>To Login:</strong> Enter your registered email address and password on the Login page. If you forget your password, contact administration for an account reset.</p>
      </div>
    )
  },
  {
    id: 'appointments',
    title: 'Booking & Managing Appointments',
    icon: Calendar,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    content: (
      <div className="space-y-4 text-slate-600 text-sm">
        <p><strong>Booking:</strong> Navigate to "Book Appointment" from your dashboard. Select your preferred doctor, date, and time slot. Enter your symptoms and confirm.</p>
        <p><strong>Rescheduling:</strong> Currently, rescheduling must be done by cancelling your existing appointment and booking a new one.</p>
        <p><strong>Cancelling:</strong> You can cancel an appointment from the "Appointments" tab as long as its status is still <strong>PENDING</strong>. Confirmed appointments cannot be cancelled by the patient directly.</p>
      </div>
    )
  },
  {
    id: 'payments',
    title: 'Payment Process',
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    content: (
      <div className="space-y-4 text-slate-600 text-sm">
        <p>Payments are required for all clinical consultations unless explicitly marked as free. You can pay securely online via the portal.</p>
        <p><strong>Steps:</strong> Go to your Appointments list, find the UNPAID appointment, and click "Pay Now". Select your payment method (Card/UPI/Netbanking) and complete the transaction. Your appointment status will automatically update to PAID.</p>
      </div>
    )
  },
  {
    id: 'refunds',
    title: 'Refund Policy',
    icon: RotateCcw,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    content: (
      <div className="space-y-4 text-slate-600 text-sm">
        <p><strong>Eligibility:</strong> Refunds are only applicable if you cancel a <strong>PAID</strong> appointment while it is still in the <strong>PENDING</strong> state.</p>
        <p><strong>Process:</strong> Once you cancel the eligible appointment, a refund is automatically initiated. The refund amount will be credited back to your original payment method within 5-7 business days.</p>
        <p><strong>Non-refundable:</strong> If an appointment is already CONFIRMED, CHECKED_IN, or COMPLETED, it cannot be refunded.</p>
      </div>
    )
  },
  {
    id: 'reports',
    title: 'Downloading Reports & Bills',
    icon: FileText,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    content: (
      <div className="space-y-4 text-slate-600 text-sm">
        <p><strong>Prescriptions & Medical Reports:</strong> Available in your Patient Dashboard under "Recent Prescriptions". Click "Download PDF" to save a digital copy.</p>
        <p><strong>Lab Reports:</strong> Once a lab technician uploads your results, they will appear under "Lab Reports" on your dashboard. You can download the attached PDF directly.</p>
      </div>
    )
  },
  {
    id: 'pharmacy',
    title: 'Ordering Medicines',
    icon: Pill,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    content: (
      <div className="space-y-4 text-slate-600 text-sm">
        <p>Patients can order medicines directly from the hospital's digital pharmacy.</p>
        <p><strong>How to order:</strong> Navigate to the "Pharmacy Store". Browse available medicines, select the required quantity, and click "Order".</p>
        <p><strong>Payment:</strong> Currently, medicine orders are added to your overall hospital bill, or you can pay at the counter upon pickup.</p>
      </div>
    )
  },
  {
    id: 'tracking',
    title: 'Tracking Medicine Orders',
    icon: Truck,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    content: (
      <div className="space-y-4 text-slate-600 text-sm">
        <p>Your medicine orders can have the following statuses:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>PENDING:</strong> Order received by the pharmacy.</li>
          <li><strong>PROCESSING:</strong> Pharmacist is preparing your order.</li>
          <li><strong>READY:</strong> Order is ready for pickup or dispatch.</li>
          <li><strong>DELIVERED/COMPLETED:</strong> You have received your medicines.</li>
        </ul>
        <p>You can track these statuses live from the "Medicine Orders" section in your dashboard.</p>
      </div>
    )
  },
  {
    id: 'notifications',
    title: 'How Notifications Work',
    icon: Bell,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    content: (
      <div className="space-y-4 text-slate-600 text-sm">
        <p>The notification bell at the top right of your dashboard keeps you updated in real-time.</p>
        <p>You will receive automated alerts for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Appointment confirmations and cancellations.</li>
          <li>Refund processing updates.</li>
          <li>When your lab reports are uploaded and ready to view.</li>
          <li>Updates on your pharmacy orders.</li>
        </ul>
      </div>
    )
  }
];

const FAQS = [
  {
    q: 'Can I book an appointment for someone else?',
    a: 'Currently, appointments are linked to the logged-in patient profile. To book for a family member, please create a separate account for them or contact the reception.'
  },
  {
    q: 'What should I do if my payment fails?',
    a: 'If a payment fails but the amount is deducted, please wait 30 minutes. If the status does not update to PAID, contact support with your transaction ID.'
  },
  {
    q: 'How long does a refund take?',
    a: 'Refunds are processed instantly on our end, but it may take 5-7 business days to reflect in your bank account depending on your payment provider.'
  }
];

const HEALTH_TIPS = [
  "Stay hydrated! Drink at least 8 glasses of water a day.",
  "Regular check-ups can detect problems before they start.",
  "Wash your hands frequently to prevent the spread of germs.",
  "Get at least 7-8 hours of sleep for a healthier immune system."
];

const HelpGuide = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [openSection, setOpenSection] = useState('auth');
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const randomTip = useMemo(() => HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)], []);

  const handleBack = () => {
    if (!user) return navigate('/');
    switch (user.role) {
      case 'ADMIN': return navigate('/admin');
      case 'DOCTOR': return navigate('/doctor');
      case 'RECEPTIONIST': return navigate('/reception');
      case 'PHARMACY': return navigate('/pharmacy');
      case 'LAB': return navigate('/lab');
      case 'PATIENT': default: return navigate('/patient');
    }
  };

  const filteredGuides = GUIDE_SECTIONS.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredFaqs = FAQS.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200 pb-20">
      
      {/* Dynamic Nav Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-md">
               <Activity className="text-white w-4 h-4" />
             </div>
             <span className="font-extrabold tracking-tight text-slate-800 hidden sm:block">NovaCare</span>
          </div>
        </div>
      </div>

      {/* Hero Section with Glassmorphism */}
      <div className="relative pt-12 pb-24 px-6 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img src="/images/healthcare-team-hero.jpg" alt="Healthcare Team" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/90 via-slate-900/80 to-slate-50"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center mt-8">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-bold mb-6 backdrop-blur-md">
              <BookOpen className="w-4 h-4" /> 24/7 Patient Support Center
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              How can we help you today?
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-10 font-medium">
              Explore our guides, track your appointments, or contact our support team. Everything you need is right here.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 rounded-2xl border-0 ring-1 ring-white/20 bg-white/10 backdrop-blur-md text-white placeholder-blue-200/70 focus:ring-2 focus:ring-blue-400 focus:bg-white shadow-2xl focus:text-slate-800 transition-all text-lg"
                placeholder="Search for booking, refunds, medicines..."
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        
        {/* Quick Actions (Patient only) */}
        {user?.role === 'PATIENT' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <Link to="/patient/book-appointment" className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform flex flex-col items-center text-center group">
               <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                 <Calendar className="w-6 h-6" />
               </div>
               <span className="font-bold text-slate-700 text-sm">Book Visit</span>
            </Link>
            <Link to="/patient" className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform flex flex-col items-center text-center group">
               <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                 <FileText className="w-6 h-6" />
               </div>
               <span className="font-bold text-slate-700 text-sm">My Reports</span>
            </Link>
            <Link to="/patient/medicines" className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform flex flex-col items-center text-center group">
               <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                 <Pill className="w-6 h-6" />
               </div>
               <span className="font-bold text-slate-700 text-sm">Order Meds</span>
            </Link>
            <a href="#support" className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 shadow-xl shadow-blue-500/30 border border-blue-500 hover:-translate-y-1 transition-transform flex flex-col items-center text-center group text-white">
               <div className="w-12 h-12 bg-white/20 text-white rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                 <Phone className="w-6 h-6" />
               </div>
               <span className="font-bold text-sm">Contact Us</span>
            </a>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Essential Guides */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><BookOpen className="w-4 h-4"/></div>
                 <h2 className="text-2xl font-extrabold text-slate-800">Essential Guides</h2>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredGuides.length > 0 ? filteredGuides.map((section) => {
                    const isOpen = openSection === section.id;
                    const Icon = section.icon;
                    return (
                      <motion.div 
                        layout
                        key={section.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`bg-white rounded-3xl border overflow-hidden transition-all duration-300 shadow-sm ${
                          isOpen ? 'border-blue-200 shadow-xl shadow-blue-900/5 ring-4 ring-blue-50 sm:col-span-2' : 'border-slate-200 hover:border-slate-300 hover:shadow-md cursor-pointer'
                        }`}
                        onClick={() => !isOpen && setOpenSection(section.id)}
                      >
                        <div className="p-6 flex items-start gap-4">
                          <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${section.bgColor} ${section.color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                               <h3 className="font-extrabold text-slate-800 text-lg truncate pr-4">{section.title}</h3>
                               {isOpen ? (
                                 <button onClick={(e) => { e.stopPropagation(); setOpenSection(null); }} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                                   <ChevronDown className="w-5 h-5 rotate-180 transition-transform" />
                                 </button>
                               ) : (
                                 <ArrowRight className="w-4 h-4 text-slate-300" />
                               )}
                            </div>
                            
                            <AnimatePresence>
                              {isOpen ? (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="mt-4 pt-4 border-t border-slate-100"
                                >
                                  {section.content}
                                </motion.div>
                              ) : (
                                <p className="text-sm text-slate-500 truncate">Click to read instructions...</p>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }) : (
                    <div className="col-span-2 p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500">
                      No guides found matching your search.
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* FAQs */}
            <section>
              <div className="flex items-center gap-3 mb-6 mt-8">
                 <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><HelpCircle className="w-4 h-4"/></div>
                 <h2 className="text-2xl font-extrabold text-slate-800">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-3">
                {filteredFaqs.length > 0 ? filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <motion.div layout key={idx} className={`bg-white rounded-2xl border transition-all ${isOpen ? 'border-indigo-200 shadow-md ring-2 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full px-6 py-5 flex items-start justify-between text-left"
                      >
                        <span className="font-bold text-slate-800 pr-4">{faq.q}</span>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform mt-0.5 shrink-0 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-4 mt-1">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                }) : (
                   <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500">
                      No FAQs found matching your search.
                   </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Did You Know */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
               <div className="absolute -right-6 -top-6 text-white/10">
                 <Heart className="w-32 h-32" />
               </div>
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4">
                   <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm"><Activity className="w-4 h-4"/></div>
                   <h3 className="font-bold text-emerald-50 tracking-wide uppercase text-xs">Health Tip</h3>
                 </div>
                 <p className="text-lg font-bold leading-tight mb-2">Did You Know?</p>
                 <p className="text-emerald-50 text-sm font-medium">{randomTip}</p>
               </div>
            </div>

            {/* Support/Emergency Card */}
            <div id="support" className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-900 p-6 text-white">
                <h3 className="text-xl font-extrabold mb-1">Need more help?</h3>
                <p className="text-sm text-slate-400">Our support team is available 24/7</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Emergency Helpdesk</p>
                    <p className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">+1 (800) 123-4567</p>
                  </div>
                </div>

                <div className="flex gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Email Support</p>
                    <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">support@smarthospital.com</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Main Branch</p>
                    <p className="font-bold text-slate-800 text-sm">123 Health Avenue<br/>Medical District, NY 10001</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default HelpGuide;
