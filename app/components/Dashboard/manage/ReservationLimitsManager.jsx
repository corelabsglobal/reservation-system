'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const ReservationLimitsManager = ({ restaurant }) => {
  const [reservationLimits, setReservationLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLimit, setNewLimit] = useState({
    date: '',
    time_slot: '',
    max_reservations: 10
  });
  const [editingLimit, setEditingLimit] = useState(null);

  // Fetch existing reservation limits
  useEffect(() => {
    const fetchReservationLimits = async () => {
      if (!restaurant?.id) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('reservation_limits')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (!error) {
        setReservationLimits(data);
      } else {
        toast.error('Failed to fetch reservation limits');
      }
      setLoading(false);
    };

    fetchReservationLimits();
  }, [restaurant]);

  // Generate time slots based on restaurant hours
  const generateTimeSlots = () => {
    const slots = [];
    const start = restaurant?.reservation_start_time ? parseInt(restaurant.reservation_start_time.split(':')[0]) : 12;
    const end = restaurant?.reservation_end_time ? parseInt(restaurant.reservation_end_time.split(':')[0]) : 22;
    const duration = restaurant?.reservation_duration_minutes || 120;
    
    for (let hour = start; hour < end; hour++) {
      for (let minute = 0; minute < 60; minute += duration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  // Add a new reservation limit
  const addReservationLimit = async () => {
    if (!newLimit.date || !newLimit.time_slot) {
      toast.error('Please select both date and time slot');
      return;
    }

    if (newLimit.max_reservations < 1) {
      toast.error('Maximum reservations must be at least 1');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reservation_limits')
        .insert([{ 
          ...newLimit,
          restaurant_id: restaurant.id
        }])
        .select();

      if (error) {
        if (error.code === '23505') {
          toast.error('A limit already exists for this date and time slot');
          return;
        }
        throw error;
      }

      setReservationLimits([...reservationLimits, data[0]]);
      setNewLimit({
        date: '',
        time_slot: '',
        max_reservations: 10
      });
      toast.success('Reservation limit added successfully');
    } catch (error) {
      console.error('Error adding reservation limit:', error);
      toast.error(error.message || 'Failed to add reservation limit');
    }
  };

  // Update an existing reservation limit
  const updateReservationLimit = async () => {
    if (!editingLimit) return;

    if (editingLimit.max_reservations < 1) {
      toast.error('Maximum reservations must be at least 1');
      return;
    }

    try {
      const { error } = await supabase
        .from('reservation_limits')
        .update({ 
          max_reservations: editingLimit.max_reservations 
        })
        .eq('id', editingLimit.id);

      if (error) throw error;

      setReservationLimits(reservationLimits.map(limit => 
        limit.id === editingLimit.id ? editingLimit : limit
      ));
      setEditingLimit(null);
      toast.success('Reservation limit updated successfully');
    } catch (error) {
      console.error('Error updating reservation limit:', error);
      toast.error(error.message || 'Failed to update reservation limit');
    }
  };

  // Delete a reservation limit
  const deleteReservationLimit = async (id) => {
    try {
      const { error } = await supabase
        .from('reservation_limits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReservationLimits(reservationLimits.filter(limit => limit.id !== id));
      toast.success('Reservation limit deleted successfully');
    } catch (error) {
      console.error('Error deleting reservation limit:', error);
      toast.error(error.message || 'Failed to delete reservation limit');
    }
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-bold text-yellow-400">Manage Reservation Limits</h3>
        <div className="group relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute hidden group-hover:block bottom-full mb-2 w-64 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg">
            Set maximum number of reservations allowed for specific time slots. This overrides the table-based availability.
          </div>
        </div>
      </div>

      {/* Add New Reservation Limit Form */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h4 className="font-semibold mb-3 text-gray-300">Add Reservation Limit</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={newLimit.date}
              onChange={(e) => setNewLimit({...newLimit, date: e.target.value})}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Time Slot</label>
            <select
              value={newLimit.time_slot}
              onChange={(e) => setNewLimit({...newLimit, time_slot: e.target.value})}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            >
              <option value="">Select time slot</option>
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Reservations</label>
            <input
              type="number"
              min="1"
              value={newLimit.max_reservations}
              onChange={(e) => setNewLimit({...newLimit, max_reservations: parseInt(e.target.value) || 1})}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            />
          </div>
        </div>

        <button
          onClick={addReservationLimit}
          className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded hover:opacity-90 transition-all text-white font-medium"
        >
          Add Limit
        </button>
      </div>

      {/* Existing Reservation Limits List */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-semibold mb-3 text-gray-300">Current Reservation Limits</h4>
        
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : reservationLimits.length === 0 ? (
          <p className="text-gray-400">No reservation limits set</p>
        ) : (
          <div className="space-y-3">
            {reservationLimits.map(limit => (
              <div key={limit.id} className="flex justify-between items-center bg-gray-700/50 p-4 rounded">
                {editingLimit?.id === limit.id ? (
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <span className="font-medium text-white">
                        {new Date(limit.date).toLocaleDateString()} at {limit.time_slot}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={editingLimit.max_reservations}
                      onChange={(e) => setEditingLimit({
                        ...editingLimit, 
                        max_reservations: parseInt(e.target.value) || 1
                      })}
                      className="w-20 p-1 bg-gray-600 rounded border border-gray-500 text-white text-center"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={updateReservationLimit}
                        className="text-green-400 hover:text-green-300 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingLimit(null)}
                        className="text-gray-400 hover:text-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="font-medium text-white">
                        {new Date(limit.date).toLocaleDateString()} at {limit.time_slot}
                      </span>
                      <span className="text-sm text-gray-400 ml-2">
                        (Max: {limit.max_reservations} reservations)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingLimit(limit)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteReservationLimit(limit.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationLimitsManager;