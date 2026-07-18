import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Droplet, Plus, Minus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const BloodBankDashboard = () => {
  const queryClient = useQueryClient();

  const { data: bloodInventory, isLoading } = useQuery({
    queryKey: ['bloodBank'],
    queryFn: async () => {
      const res = await axios.get('/api/hospital/blood-bank', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.data;
    }
  });

  const updateBloodMutation = useMutation({
    mutationFn: async ({ id, units_available }) => {
      const res = await axios.put(`/api/hospital/blood-bank/${id}`, 
        { units_available }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bloodBank']);
    }
  });

  const handleAdjust = (blood, change) => {
    const newUnits = blood.units_available + change;
    if (newUnits >= 0) {
      updateBloodMutation.mutate({ id: blood.id, units_available: newUnits });
    }
  };

  const getStockLevelColor = (units) => {
    if (units === 0) return 'text-red-600 bg-red-50 border-red-200';
    if (units <= 5) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Droplet className="mr-3 text-red-600 fill-current" /> Blood Bank Inventory
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12 text-gray-500">Loading blood bank data...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {bloodInventory?.map((blood) => (
            <motion.div 
              key={blood.id}
              whileHover={{ scale: 1.02 }}
              className={`rounded-2xl border p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden ${getStockLevelColor(blood.units_available)}`}
            >
              {blood.units_available <= 5 && (
                <div className="absolute top-2 right-2">
                  <AlertCircle size={20} className={`${blood.units_available === 0 ? 'text-red-500' : 'text-orange-500'}`} />
                </div>
              )}
              
              <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mb-4">
                <span className="text-3xl font-black text-gray-800">{blood.blood_group}</span>
              </div>
              
              <div className="text-sm font-medium opacity-80 mb-1">Available Units</div>
              <div className="text-4xl font-bold text-gray-900 mb-6">{blood.units_available}</div>
              
              <div className="flex items-center space-x-4 bg-white/60 p-2 rounded-xl backdrop-blur-sm">
                <button 
                  onClick={() => handleAdjust(blood, -1)}
                  disabled={blood.units_available === 0 || updateBloodMutation.isPending}
                  className="p-2 rounded-lg bg-white hover:bg-gray-100 text-gray-700 shadow-sm disabled:opacity-50 transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="font-semibold text-gray-700 w-4"></span>
                <button 
                  onClick={() => handleAdjust(blood, 1)}
                  disabled={updateBloodMutation.isPending}
                  className="p-2 rounded-lg bg-white hover:bg-gray-100 text-gray-700 shadow-sm transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="text-xs mt-4 opacity-70">
                Last updated: {new Date(blood.last_updated).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BloodBankDashboard;
