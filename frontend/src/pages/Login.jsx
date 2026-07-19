import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Mail, Lock, ChevronDown, ChevronUp, User } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'DOCTOR') navigate('/doctor');
      else if (user.role === 'RECEPTIONIST') navigate('/reception');
      else if (user.role === 'PATIENT') navigate('/patient');
      else if (user.role === 'PHARMACY') navigate('/pharmacy');
      else if (user.role === 'LAB') navigate('/lab');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleDemoFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };


  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-800">
      {/* Left Image Section */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden">
        <img 
          src="/login-bg.png" 
          alt="Smart Hospital" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/40" />
        <div className="relative z-10 flex flex-col justify-end p-16 text-white h-full pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Activity className="text-white w-7 h-7" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">NovaCare</h1>
            </div>
            <h2 className="text-4xl font-extrabold leading-tight mb-4">
              The Future of <br/> Healthcare Management
            </h2>
            <p className="text-lg text-slate-300 max-w-md">
              Streamline hospital operations, enhance patient care, and empower your medical staff with our AI-driven platform.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-slate-50 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-200/40 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-200/40 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md py-10"
        >
          <div className="mb-10 lg:hidden flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-4">
              <Activity className="text-white w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">NovaCare</h2>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 font-medium">Please enter your details to sign in.</p>
          </div>

          {error && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 font-medium">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white shadow-sm transition-all font-medium text-slate-800 placeholder-slate-400"
                  placeholder="Enter your email"
                  required 
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <a href="mailto:support@novacare.com?subject=NovaCare%20password%20help" className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">Need password help?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white shadow-sm transition-all font-medium text-slate-800 placeholder-slate-400"
                  placeholder="••••••••"
                  required 
                  autoComplete="new-password"
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all mt-4"
            >
              Sign In
            </motion.button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-8 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <button 
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-slate-500" />
                  <span className="font-bold text-sm text-slate-700">Demo Accounts</span>
                </div>
                {showDemo ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </button>
              <AnimatePresence>
                {showDemo && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-200"
                  >
                    <div className="p-4 grid grid-cols-2 gap-3">
                      <button onClick={() => handleDemoFill('admin@hospital.com')} className="text-xs font-bold px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-left transition-colors">Admin</button>
                      <button onClick={() => handleDemoFill('doctor@hospital.com')} className="text-xs font-bold px-3 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-left transition-colors">Doctor</button>
                      <button onClick={() => handleDemoFill('reception@hospital.com')} className="text-xs font-bold px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-left transition-colors">Receptionist</button>
                      <button onClick={() => handleDemoFill('patient@test.com')} className="text-xs font-bold px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-left transition-colors">Patient</button>
                      <button onClick={() => handleDemoFill('pharmacy@hospital.com')} className="text-xs font-bold px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-left transition-colors">Pharmacy</button>
                      <button onClick={() => handleDemoFill('lab@hospital.com')} className="text-xs font-bold px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-left transition-colors">Lab</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <p className="text-center mt-8 text-slate-500 font-medium">
            Don't have an account? <Link to="/register" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">Create account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
