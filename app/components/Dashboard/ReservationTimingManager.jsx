"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const ReservationTimingManager = ({ restaurant, setRestaurant }) => {
  const [timingSettings, setTimingSettings] = useState({
    duration: 120,
    startTime: '12:00',
    endTime: '22:00'
  });

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const validateTime = (timeStr, isEndTime = false) => {
    const minutes = timeToMinutes(timeStr);
    
    if (isEndTime) {
      if (minutes === 0) {
        toast.error('End time cannot be 12 AM (00:00)');
        return false;
      }
      if (minutes > 23 * 60 + 59) {
        toast.error('End time cannot be later than 11:59 PM (23:59)');
        return false;
      }
    }
    
    return true;
  };

  useEffect(() => {
    if (restaurant) {
      const defaults = {
        duration: 120,
        startTime: '12:00',
        endTime: '22:00'
      };
      
      // Get times from database or use defaults
      let dbStartTime = restaurant.reservation_start_time 
        ? restaurant.reservation_start_time.slice(0, 5) 
        : defaults.startTime;
      
      let dbEndTime = restaurant.reservation_end_time 
        ? restaurant.reservation_end_time.slice(0, 5) 
        : defaults.endTime;

      // Validate end time
      if (!validateTime(dbEndTime, true)) {
        dbEndTime = defaults.endTime;
      }

      setTimingSettings({
        duration: restaurant.reservation_duration_minutes || defaults.duration,
        startTime: dbStartTime,
        endTime: dbEndTime
      });
    }
  }, [restaurant]);

  // Handle time changes with validation
  const handleTimeChange = (field, value) => {
    const isEndTime = field === 'endTime';
    
    // Validate the time
    if (isEndTime && !validateTime(value, true)) {
      return;
    }
    
    setTimingSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update timing settings in database
  const updateTimingSettings = async () => {
    try {
      // Final validation
      if (!validateTime(timingSettings.endTime, true)) {
        toast.error('Please correct the end time before saving');
        return;
      }

      const { error } = await supabase
        .from('restaurants')
        .update({
          reservation_duration_minutes: timingSettings.duration,
          reservation_start_time: timingSettings.startTime + ':00',
          reservation_end_time: timingSettings.endTime + ':00'
        })
        .eq('id', restaurant.id);

      if (error) throw error;

      // Update local state
      setRestaurant({
        ...restaurant,
        reservation_duration_minutes: timingSettings.duration,
        reservation_start_time: timingSettings.startTime + ':00',
        reservation_end_time: timingSettings.endTime + ':00'
      });

      toast.success('Reservation timing settings updated successfully');
    } catch (error) {
      console.error('Error updating timing settings:', error);
      toast.error('Failed to update timing settings');
    }
  };

  return (
    <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-bold text-yellow-400">Reservation Timing</h3>
        <div className="group relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute hidden group-hover:block bottom-full mb-2 w-64 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg">
            Configure your reservation time slots and duration. This controls when customers can make reservations.
            <br /><br />
            Note: End time must be between 12:01 AM (00:01) and 11:59 PM (23:59).
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Duration Setting */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Reservation Duration (minutes)
          </label>
          <select
            value={timingSettings.duration}
            onChange={(e) => setTimingSettings({...timingSettings, duration: parseInt(e.target.value)})}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
          >
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
            <option value="120">120 minutes</option>
            <option value="150">150 minutes</option>
            <option value="180">180 minutes</option>
          </select>
        </div>

        {/* Start Time Setting */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            First Reservation Time
          </label>
          <input
            type="time"
            value={timingSettings.startTime}
            onChange={(e) => handleTimeChange('startTime', e.target.value)}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            step="900" 
          />
        </div>

        {/* End Time Setting */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Last Reservation Time (00:01 - 23:59)
          </label>
          <input
            type="time"
            value={timingSettings.endTime}
            onChange={(e) => handleTimeChange('endTime', e.target.value)}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            step="900"
            min="00:01"
            max="23:59"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={updateTimingSettings}
          className="bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-2 rounded-lg hover:opacity-80 transition-all text-white font-semibold"
        >
          Save Timing Settings
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <p>Current settings:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>Duration: {timingSettings.duration} minutes per reservation</li>
          <li>Reservations accepted from {timingSettings.startTime} to {timingSettings.endTime}</li>
        </ul>
      </div>
    </div>
  );
};

export default ReservationTimingManager;