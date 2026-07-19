import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from '../api/axios';
import { Camera, Check, Trash2, Save, Loader2, User, Key, Shield, Calendar, MapPin, Phone, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLayoutForRole } from '../utils/LayoutResolver';

const Profile = ({ title = 'Profile Management' }) => {
  const { user } = useContext(AuthContext);
  const LayoutComponent = getLayoutForRole(user?.role);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    emergency_contact: '',
    profile_image_url: '',
    password: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const { data } = await axios.get('/api/auth/me', config);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
          gender: data.gender || '',
          address: data.address || '',
          emergency_contact: data.emergency_contact || '',
          profile_image_url: data.profile_image_url || '',
          password: ''
        });
      } catch (error) {
        toast.error('Failed to load profile data');
      } finally {
        setInitialFetch(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    setFormData({ ...formData, profile_image_url: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      let imageUrl = formData.profile_image_url;

      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        const { data: uploadRes } = await axios.post('/api/upload', uploadData, config);
        imageUrl = uploadRes.url;
      }

      const updateData = { ...formData, profile_image_url: imageUrl };
      
      if (!updateData.password) {
        delete updateData.password;
      }

      const { data } = await axios.put('/api/auth/profile', updateData, config);
      
      // Update local storage so Context initialization uses it on reload
      window.localStorage.setItem('user', JSON.stringify({ ...user, ...data }));
      toast.success('Profile updated successfully!');
      
      // The user wants instant updates across Navbar/Sidebar without refresh.
      // Usually achieved by AuthContext `setUser(data)`. But since we only have `user` from context (and not a direct updater),
      // reloading window is standard, but if we don't want refresh, we can dispatch a custom event and update AuthContext.
      window.dispatchEvent(new Event('auth_updated'));
      
      // Clear password field
      setFormData({ ...formData, password: '', profile_image_url: imageUrl });
      
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (initialFetch) {
    return (
      <LayoutComponent title={title}>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </LayoutComponent>
    );
  }

  const currentDisplayImage = previewImage || formData.profile_image_url;

  return (
    <LayoutComponent title={title}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 overflow-hidden relative">
          <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          </div>
          
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 relative z-10">
              {/* Avatar Upload */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-xl">
                  <div className="w-full h-full rounded-2xl bg-slate-100 overflow-hidden relative flex items-center justify-center">
                    {currentDisplayImage ? (
                      <img src={currentDisplayImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-slate-400" />
                    )}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-opacity backdrop-blur-sm">
                      <label className="flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5 text-white mb-1" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                      {currentDisplayImage && (
                        <button type="button" onClick={(e) => { e.preventDefault(); handleRemovePhoto(); }} className="flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                          <Trash2 className="w-5 h-5 text-red-400 mb-1" />
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 pb-2">
                <h2 className="text-3xl font-extrabold text-slate-800">{formData.first_name} {formData.last_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg uppercase tracking-wider">{user?.role}</span>
                  <span className="text-sm font-medium text-slate-500">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Stats & Read-only Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" /> Account Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Check className="w-4 h-4"/></div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Email Verified</p>
                      <p className="text-[10px] text-slate-500">Secure Account</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Calendar className="w-4 h-4"/></div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Member Since</p>
                      <p className="text-[10px] text-slate-500">{new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" /> Personal Information
                </h3>
              </div>
              <div className="p-6 space-y-6">
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 ml-1">First Name</label>
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium bg-slate-50 focus:bg-white text-slate-800" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 ml-1">Last Name</label>
                    <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium bg-slate-50 focus:bg-white text-slate-800" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 ml-1">Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium bg-slate-50 focus:bg-white text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 ml-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium bg-slate-50 focus:bg-white text-slate-800">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 ml-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium bg-slate-50 focus:bg-white text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 ml-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-red-500"/> Emergency Contact</label>
                    <input type="text" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} placeholder="Name - Phone" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium bg-slate-50 focus:bg-white text-slate-800" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Full Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium bg-slate-50 focus:bg-white text-slate-800 resize-none"></textarea>
                </div>

                <div className="pt-4 mt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Key className="w-4 h-4 text-emerald-600" /> Change Password
                  </h4>
                  <div className="space-y-1.5">
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter new password (leave blank to keep current)" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium bg-slate-50 focus:bg-white text-slate-800 placeholder:font-normal" />
                  </div>
                </div>

              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 flex items-center transition-all disabled:opacity-70">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </LayoutComponent>
  );
};

export default Profile;
