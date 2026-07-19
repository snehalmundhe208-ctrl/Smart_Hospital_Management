import React, { useState, useEffect } from 'react';
import PatientLayout from '../layouts/PatientLayout';
import axios from '../api/axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, FileText, CreditCard, X } from 'lucide-react';
import { downloadInvoiceReceipt } from '../utils/exportUtils';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [formData, setFormData] = useState({
    doctor_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '',
    type: 'WALK_IN',
    symptoms: '',
    full_name: '',
    age: '',
    gender: 'Male',
    phone_number: '',
    blood_group: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [paying, setPaying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await axios.get('/api/doctors');
        setDoctors(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, doctor_id: data[0].id }));
        }
      } catch (err) {
        console.error('Error fetching doctors', err);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (formData.doctor_id && formData.appointment_date) {
        try {
          const { data } = await axios.get(`/api/doctors/${formData.doctor_id}/availability?date=${formData.appointment_date}`);
          setBookedSlots(data.map(slot => slot.appointment_time));
        } catch (err) {
          console.error('Error fetching availability', err);
        }
      }
    };
    fetchAvailability();
    setFormData(prev => ({ ...prev, appointment_time: '' })); // reset time on date/doctor change
  }, [formData.doctor_id, formData.appointment_date]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.post('/api/appointments', formData, config);
      setPendingAppointment(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    }
  };

  const handlePayment = async () => {
    if (!pendingAppointment) return;
    if (paymentMethod === 'CARD') {
      if (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvv) {
        setError('All card fields are required.');
        return;
      }
      if (cardDetails.number.replace(/\D/g, '').length !== 16) {
        setError('Card number must be exactly 16 digits.');
        return;
      }
    }
    setPaying(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.post(`/api/billing/appointments/${pendingAppointment.id}/pay`, { payment_method: paymentMethod }, config);
      
      try {
        await downloadInvoiceReceipt(data.invoice, { name: formData.full_name });
      } catch (pdfErr) {
        console.error('Failed to download PDF receipt:', pdfErr);
      }
      
      setPendingAppointment(null);
      setSuccess(true);
      setTimeout(() => navigate('/patient/appointments'), 1600);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment could not be completed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <PatientLayout title="Schedule consultation">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Schedule a Consultation</h2>
        <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl mb-6 flex items-start gap-3">
          <div className="mt-0.5"><User size={16} /></div>
          <p><strong>Note:</strong> Booking an appointment creates a PENDING request. You must complete the payment process securely online to confirm your consultation slot.</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6">Payment received. Your appointment is confirmed and your receipt has downloaded.</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Doctor</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <select 
                name="doctor_id" 
                value={formData.doctor_id}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                required
              >
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.first_name} {doc.last_name} - {doc.department_name || doc.specialization} {doc.total_reviews > 0 ? `(⭐ ${Number(doc.average_rating).toFixed(1)} | ${doc.total_reviews} reviews)` : '(New)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Patient Full Name</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" required placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" required placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" required min="0" max="150" placeholder="e.g. 35" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Blood Group (Optional)</label>
              <select name="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50">
                <option value="">Select</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="date" 
                  name="appointment_date"
                  value={formData.appointment_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Time Slot</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(time => {
                  const isBooked = bookedSlots.includes(`${time}:00`) || bookedSlots.includes(time);
                  const isSelected = formData.appointment_time === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setFormData({ ...formData, appointment_time: time })}
                      className={`py-2 px-1 text-sm font-bold rounded-xl border transition-all ${
                        isBooked 
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through decoration-slate-400 opacity-70' 
                          : isSelected 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-105' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-700'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
              {!formData.appointment_time && <p className="text-sm text-red-500 mt-2">Please select a time slot.</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Consultation Type</label>
            <div className="flex gap-4">
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value="WALK_IN" checked={formData.type === 'WALK_IN'} onChange={handleChange} className="text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-slate-700">In-Person (Walk-in)</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value="ONLINE" checked={formData.type === 'ONLINE'} onChange={handleChange} className="text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-slate-700">Online Video</span>
               </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Symptoms / Reason for Visit</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="h-5 w-5 text-slate-400" />
              </div>
              <textarea 
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                rows="4"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 resize-none"
                placeholder="Briefly describe your symptoms..."
                required
              ></textarea>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: formData.appointment_time ? 1.02 : 1 }}
            whileTap={{ scale: formData.appointment_time ? 0.98 : 1 }}
            type="submit"
            disabled={!formData.appointment_time}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to secure payment
          </motion.button>
        </form>
      </div>

      {pendingAppointment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-emerald-700">Secure consultation payment</p><h3 className="mt-1 text-xl font-extrabold text-slate-900">Confirm your appointment</h3><p className="mt-2 text-sm text-slate-500">Payment is required before the doctor time slot is confirmed.</p></div><button onClick={() => setPendingAppointment(null)} aria-label="Close payment" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
          <div className="my-5 flex justify-center">
             <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=novacare@upi&pn=NovaCare&am=${Number(doctors.find((doctor) => doctor.id === pendingAppointment.doctor_id)?.consultation_fee || 0).toFixed(2)}&cu=INR`} alt="QR Code" className="w-32 h-32 object-contain mx-auto" />
               <p className="text-center text-xs text-slate-500 mt-2 font-medium">Scan to Pay via UPI</p>
             </div>
          </div>
          <div className="mb-5 rounded-2xl bg-emerald-50 p-4 flex justify-between items-center"><p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Consultation fee</p><p className="text-2xl font-extrabold text-emerald-900">${Number(doctors.find((doctor) => doctor.id === pendingAppointment.doctor_id)?.consultation_fee || 0).toFixed(2)}</p></div>
          <label className="block text-sm font-bold text-slate-700">Payment method
            <select value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value); setError(''); }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none ring-emerald-500 focus:ring-2">
              <option value="UPI">UPI</option>
              <option value="CARD">Debit or credit card</option>
              <option value="NET_BANKING">Net banking</option>
            </select>
          </label>
          
          {paymentMethod === 'CARD' && (
            <div className="mt-4 space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <input type="text" placeholder="Card Number (16 digits)" value={cardDetails.number} onChange={e => setCardDetails({...cardDetails, number: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" maxLength={16} />
              <input type="text" placeholder="Cardholder Name" value={cardDetails.name} onChange={e => setCardDetails({...cardDetails, name: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              <div className="flex gap-4">
                <input type="text" placeholder="MM/YY" value={cardDetails.expiry} onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" maxLength={5} />
                <input type="text" placeholder="CVV" value={cardDetails.cvv} onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})} className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" maxLength={4} />
              </div>
            </div>
          )}
          <button disabled={paying} onClick={handlePayment} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"><CreditCard className="h-4 w-4" />{paying ? 'Processing payment…' : 'Pay and confirm appointment'}</button>
        </div>
      </div>}
    </PatientLayout>
  );
};

export default BookAppointment;
