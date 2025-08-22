'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const ClosureDaysManager = ({ restaurant }) => {
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newClosure, setNewClosure] = useState({
    date: '',
    reason: '',
    is_recurring: false,
    day_of_week: null
  });

  // Fetch existing closure days
  useEffect(() => {
    const fetchClosures = async () => {
      if (!restaurant?.id) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_closures')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('date', { ascending: true });

      if (!error) {
        setClosures(data);
      } else {
        toast.error('Failed to fetch closure days');
      }
      setLoading(false);
    };

    fetchClosures();
  }, [restaurant]);

  // Add a new closure day
  const addClosure = async () => {
    if (!newClosure.date && (newClosure.day_of_week === null || newClosure.day_of_week === undefined)) {
        toast.error('Please select either a specific date or a recurring day');
        return;
    }

    try {
      const { data, error } = await supabase
        .from('restaurant_closures')
        .insert([{ 
          ...newClosure,
          date: newClosure.date || null,
          restaurant_id: restaurant.id
        }])
        .select();

      if (error) throw error;

      setClosures([...closures, data[0]]);
      setNewClosure({
        date: '',
        reason: '',
        is_recurring: false,
        day_of_week: null
      });
      toast.success('Closure day added successfully');
    } catch (error) {
      console.error('Error adding closure:', error);
      toast.error(error.message || 'Failed to add closure day');
    }
  };

  // Delete a closure day
  const deleteClosure = async (id) => {
    try {
      const { error } = await supabase
        .from('restaurant_closures')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClosures(closures.filter(closure => closure.id !== id));
      toast.success('Closure day removed successfully');
    } catch (error) {
      console.error('Error deleting closure:', error);
      toast.error(error.message || 'Failed to remove closure day');
    }
  };

  // Toggle between date and day of week input
  const toggleRecurring = (isRecurring) => {
    setNewClosure({
      ...newClosure,
      is_recurring: isRecurring,
      date: isRecurring ? '' : newClosure.date,
      day_of_week: isRecurring ? newClosure.day_of_week : null
    });
  };

  return (
    <div className="bg-gray-700/50 p-4 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-bold text-yellow-400">Manage Closure Days</h3>
        <div className="group relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute hidden group-hover:block bottom-full mb-2 w-64 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg">
            Set days when your restaurant will be closed. You can add specific dates (like holidays) or recurring days (like Sundays).
          </div>
        </div>
      </div>

      {/* Add New Closure Form */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h4 className="font-semibold mb-3 text-gray-300">Add Closure Day</h4>
        
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => toggleRecurring(false)}
            className={`px-3 py-1 rounded-md text-sm ${!newClosure.is_recurring ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Specific Date
          </button>
          <button
            onClick={() => toggleRecurring(true)}
            className={`px-3 py-1 rounded-md text-sm ${newClosure.is_recurring ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Recurring Day
          </button>
        </div>

        {!newClosure.is_recurring ? (
          <div className="mb-3">
            <label className="block text-sm text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={newClosure.date}
              onChange={(e) => setNewClosure({...newClosure, date: e.target.value})}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        ) : (
          <div className="mb-3">
            <label className="block text-sm text-gray-400 mb-1">Day of Week</label>
            <select
              value={newClosure.day_of_week !== null && newClosure.day_of_week !== undefined ? newClosure.day_of_week : ''}
              onChange={(e) => setNewClosure({...newClosure, day_of_week: parseInt(e.target.value)})}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            >
              <option value="">Select day</option>
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
            </select>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">Reason (optional)</label>
          <input
            type="text"
            placeholder="E.g., Holiday, Maintenance, etc."
            value={newClosure.reason}
            onChange={(e) => setNewClosure({...newClosure, reason: e.target.value})}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
          />
        </div>

        <button
          onClick={addClosure}
          className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded hover:opacity-90 transition-all text-white font-medium"
        >
          Add Closure Day
        </button>
      </div>

      {/* Existing Closures List */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-semibold mb-3 text-gray-300">Scheduled Closures</h4>
        
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : closures.length === 0 ? (
          <p className="text-gray-400">No closure days scheduled</p>
        ) : (
          <div className="space-y-2">
            {closures.map(closure => (
              <div key={closure.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
                <div>
                  {closure.is_recurring ? (
                    <span className="font-medium">
                      Every {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][closure.day_of_week]}
                    </span>
                  ) : (
                    <span className="font-medium">
                      {new Date(closure.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  )}
                  {closure.reason && (
                    <p className="text-xs text-gray-400 mt-1">Reason: {closure.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteClosure(closure.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClosureDaysManager;