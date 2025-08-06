'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import ReservationNotification from '../restaurants/ReservationNotification';

export default function EditableProfile({ 
  user, 
  userProfile, 
  restaurant, 
  onUpdate 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: user?.email || '',
    restaurantName: restaurant?.name || ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: userProfile?.name || '',
      email: user?.email || '',
      restaurantName: restaurant?.name || ''
    });
  }, [user, userProfile, restaurant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user email in auth
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });

        if (emailError) throw emailError;
      }

      // Update user profile in database
      const updates = {};
      if (formData.name !== userProfile?.name) {
        updates.name = formData.name;
      }

      if (Object.keys(updates).length > 0) {
        const { error: profileError } = await supabase
          .from('users')
          .update(updates)
          .eq('owner_id', user.id);

        if (profileError) throw profileError;
      }

      // Update restaurant name if user is owner
      if (restaurant && formData.restaurantName !== restaurant.name) {
        const { error: restaurantError } = await supabase
          .from('restaurants')
          .update({ name: formData.restaurantName })
          .eq('id', restaurant.id);

        if (restaurantError) throw restaurantError;
      }

      setNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your changes have been saved successfully'
      });

      setIsEditing(false);
      onUpdate(); // Trigger parent to refetch data
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update profile'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <ReservationNotification 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />

      {!isEditing ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-3 py-3 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white"
            >
              <FiEdit2 className="h-4 w-4" />
              Edit Profile
            </button>
          </div>
        </div>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {restaurant && (
              <div>
                <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-300 mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white"
            >
              <FiX className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1 px-4 py-2 text-sm rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <FiCheck className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </motion.form>
      )}
    </div>
  );
}