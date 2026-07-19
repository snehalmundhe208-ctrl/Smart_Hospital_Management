import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Truck, MapPin, Phone, CheckCircle, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AmbulanceDashboard = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ patient_name: '', phone: '', pickup_address: '' });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['ambulance'],
    queryFn: async () => {
      const res = await axios.get('/api/hospital/ambulance', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.data;
    }
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post('/api/hospital/ambulance', data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ambulance']);
      setIsModalOpen(false);
      setNewRequest({ patient_name: '', phone: '', pickup_address: '' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, driver_name, vehicle_number }) => {
      const res = await axios.put(`/api/hospital/ambulance/${id}`, 
        { status, driver_name, vehicle_number }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ambulance']);
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createRequestMutation.mutate(newRequest);
  };

  const handleDispatch = (id) => {
    const driver = prompt("Enter Driver Name:");
    const vehicle = prompt("Enter Vehicle Number (e.g. AMB-102):");
    if (driver && vehicle) {
      updateStatusMutation.mutate({ id, status: 'DISPATCHED', driver_name: driver, vehicle_number: vehicle });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'DISPATCHED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ARRIVED': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Truck className="mr-3 text-red-500" /> Ambulance Dispatch
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
        >
          + Emergency Request
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12 text-gray-500">Loading ambulance requests...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests?.map((req) => (
            <motion.div 
              key={req.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${req.status === 'PENDING' ? 'bg-yellow-400' : req.status === 'DISPATCHED' ? 'bg-blue-500' : req.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{req.patient_name}</h3>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <Phone size={14} className="mr-1" /> {req.phone}
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${getStatusColor(req.status)}`}>
                  {req.status}
                </span>
              </div>

              <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl flex items-start">
                <MapPin size={16} className="mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                <span>{req.pickup_address}</span>
              </div>

              {req.driver_name && (
                <div className="mb-4 text-sm bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100">
                  <div className="font-semibold mb-1">Dispatch Info:</div>
                  <div>Driver: {req.driver_name}</div>
                  <div>Vehicle: {req.vehicle_number}</div>
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                {req.status === 'PENDING' && (
                  <button onClick={() => handleDispatch(req.id)} className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg text-sm font-medium transition-colors">
                    Dispatch
                  </button>
                )}
                {req.status === 'DISPATCHED' && (
                  <button onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'ARRIVED' })} className="flex-1 bg-purple-50 text-purple-600 hover:bg-purple-100 py-2 rounded-lg text-sm font-medium transition-colors">
                    Mark Arrived
                  </button>
                )}
                {req.status === 'ARRIVED' && (
                  <button onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'COMPLETED' })} className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                    <CheckCircle size={16} className="mr-1" /> Complete
                  </button>
                )}
                {(req.status === 'PENDING' || req.status === 'DISPATCHED') && (
                  <button onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'CANCELLED' })} className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                    <XCircle size={16} className="mr-1" /> Cancel
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {requests?.length === 0 && (
            <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
              No ambulance requests found.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">New Emergency Request</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient/Caller Name</label>
                <input required type="text" className="w-full border-gray-300 rounded-xl p-2.5 bg-gray-50 border focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all" value={newRequest.patient_name} onChange={e => setNewRequest({...newRequest, patient_name: e.target.value})} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input required type="text" className="w-full border-gray-300 rounded-xl p-2.5 bg-gray-50 border focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all" value={newRequest.phone} onChange={e => setNewRequest({...newRequest, phone: e.target.value})} />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                <textarea required rows="3" className="w-full border-gray-300 rounded-xl p-2.5 bg-gray-50 border focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none" value={newRequest.pickup_address} onChange={e => setNewRequest({...newRequest, pickup_address: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={createRequestMutation.isPending} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-70">
                  {createRequestMutation.isPending ? 'Sending...' : 'Dispatch Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AmbulanceDashboard;
