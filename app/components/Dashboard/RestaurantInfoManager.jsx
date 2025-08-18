'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(
  () => import('@/components/ui/Map'),
  { ssr: false }
);

const RestaurantInfoManager = ({ restaurant, setRestaurant }) => {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with restaurant data
  useEffect(() => {
    if (restaurant) {
      setDescription(restaurant.description || '');
      setAddress(restaurant.address || '');
      
      // Handle both location formats (direct object or nested in location property)
      if (restaurant.location) {
        setLocation({
          lat: restaurant.location.latitude || restaurant.location.lat,
          lng: restaurant.location.longitude || restaurant.location.lng
        });
      } else if (restaurant.latitude && restaurant.longitude) {
        setLocation({
          lat: restaurant.latitude,
          lng: restaurant.longitude
        });
      } else {
        setLocation(null);
      }
    }
  }, [restaurant]);

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
  };

  const handleSave = async () => {
    if (!restaurant) return;
    
    setIsSaving(true);
    try {
      // Prepare updates object
      const updates = {
        description,
        address,
        updated_at: new Date().toISOString()
      };

      // Handle location updates based on your Supabase schema
      if (location) {
        // Choose one of these based on your schema:
        
        // Option 1: If location is stored as JSONB
        updates.location = {
          latitude: location.lat,
          longitude: location.lng
        };
        
        // OR Option 2: If stored as separate columns
        // updates.latitude = location.lat;
        // updates.longitude = location.lng;
      }

      const { data, error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', restaurant.id)
        .select()
        .single();

      if (error) throw error;

      setRestaurant(data);
      toast.success('Restaurant information updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error(error.message || 'Failed to update restaurant information');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-yellow-400">Restaurant Information</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-3 py-1 rounded text-sm ${isEditing ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gradient-to-r from-yellow-400 to-pink-600'} transition-all`}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-yellow-400"
              rows="4"
              placeholder="Tell customers about your restaurant..."
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-yellow-400"
              placeholder="Enter your restaurant's full address"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Location</label>
            <div className="h-64 bg-gray-800 rounded-lg overflow-hidden">
              <MapWithNoSSR 
                location={location}
                onLocationSelect={handleLocationSelect}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Search for your restaurant above the map or click on the map to set location
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-2 rounded-lg hover:opacity-80 transition-all text-white font-semibold disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="text-gray-300 font-medium mb-1">Description</h4>
            <p className="text-gray-200 whitespace-pre-line">
              {description || 'No description provided'}
            </p>
          </div>

          <div>
            <h4 className="text-gray-300 font-medium mb-1">Address</h4>
            <p className="text-gray-200">
              {address || 'No address provided'}
            </p>
          </div>

          {location && (
            <div>
              <h4 className="text-gray-300 font-medium mb-1">Location</h4>
              <div className="h-64 bg-gray-800 rounded-lg overflow-hidden">
                <MapWithNoSSR 
                  location={location}
                  interactive={false}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantInfoManager;