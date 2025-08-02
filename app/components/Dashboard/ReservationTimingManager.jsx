import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const ReservationTimingManager = ({ restaurant, setRestaurant }) => {
  const [timingSettings, setTimingSettings] = useState({
    duration: 120,
    startTime: '12:00',
    endTime: '22:00'
  });

  useEffect(() => {
    if (restaurant) {
      setTimingSettings({
        duration: restaurant.reservation_duration_minutes || 120,
        startTime: restaurant.reservation_start_time ? 
          restaurant.reservation_start_time.slice(0, 5) : '12:00',
        endTime: restaurant.reservation_end_time ? 
          restaurant.reservation_end_time.slice(0, 5) : '22:00'
      });
    }
  }, [restaurant]);

  const updateTimingSettings = async () => {
    try {
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
            onChange={(e) => setTimingSettings({...timingSettings, startTime: e.target.value})}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            step="900"
          />
        </div>

        {/* End Time Setting */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Last Reservation Time
          </label>
          <input
            type="time"
            value={timingSettings.endTime}
            onChange={(e) => setTimingSettings({...timingSettings, endTime: e.target.value})}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            step="900"
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