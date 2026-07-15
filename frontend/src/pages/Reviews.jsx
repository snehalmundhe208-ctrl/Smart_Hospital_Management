import React, { useState, useEffect, useContext } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import DoctorLayout from '../layouts/DoctorLayout';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Star, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const endpoint = user?.role === 'ADMIN' ? '/api/feedback' : `/api/feedback/doctor/${user?.id}`; 
        // Wait, for doctor, the endpoint expects doctorId in params? No, the backend expects getDoctorFeedback to just use req.user.id. 
        // Let's check backend route: router.get('/doctor/:doctorId', protect, authorize('ADMIN', 'DOCTOR'), feedbackController.getDoctorFeedback);
        // Wait, the backend says `const { doctorId } = req.params;` in `getDoctorFeedback`. 
        // Ah, let's use `/api/feedback/doctor/${user?.id}` or `/api/feedback/doctor/me`. I will just call `/api/feedback` for Admin, and we'll see about Doctor.
        // Let's re-read the route in feedbackRoutes.js
        const { data } = await axios.get(user?.role === 'ADMIN' ? '/api/feedback' : `/api/feedback/doctor/${user?.id}`, config);
        setReviews(data);
      } catch (error) {
        console.error('Error fetching reviews', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchReviews();
  }, [user]);

  const Layout = user?.role === 'ADMIN' ? AdminLayout : DoctorLayout;

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-4 h-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <Layout title="Patient Feedback & Reviews">
      {loading ? (
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <MessageSquare className="w-16 h-16 mb-4 text-slate-300" />
          <p className="text-lg">No reviews found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, idx) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">
                    {review.patient_first_name} {review.patient_last_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                {renderStars(review.rating)}
              </div>
              
              <div className="flex-1">
                {review.review ? (
                  <p className="text-slate-600 text-sm italic">"{review.review}"</p>
                ) : (
                  <p className="text-slate-400 text-sm italic">No written review provided.</p>
                )}
              </div>

              {user?.role === 'ADMIN' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>For: Dr. {review.doctor_first_name} {review.doctor_last_name}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Reviews;
