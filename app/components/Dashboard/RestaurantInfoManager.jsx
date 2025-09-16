'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const addressInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

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

  // Load Google Maps script for geocoding
  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    // Load Google Maps script if not already loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGoogleMapsLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    } else if (window.google && window.google.maps) {
      // Script is already loaded
      setGoogleMapsLoaded(true);
    } else {
      // Script is loading, wait for it
      existingScript.onload = () => {
        setGoogleMapsLoaded(true);
      };
    }
  }, []);

  // Handle clicks outside the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && 
          addressInputRef.current && !addressInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Clear timeout on unmount
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
  };

  const fetchAddressSuggestions = useCallback(async (query) => {
    if (!query || query.length < 3 || !googleMapsLoaded) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
      return;
    }
    
    try {
      setIsLoadingSuggestions(true);
      
      // Use Google Maps Geocoding API directly
      const geocoder = new window.google.maps.Geocoder();
      
      // Search globally first
      geocoder.geocode({
        address: query
      }, (results, status) => {
        if (status !== window.google.maps.GeocoderStatus.OK || !results) {
          setAddressSuggestions([]);
          setShowSuggestions(false);
          setIsLoadingSuggestions(false);
          return;
        }

        // Filter and prioritize Ghana results
        const ghanaResults = results.filter(result => {
          const address = result.formatted_address.toLowerCase();
          return address.includes('ghana') || address.includes('accra') || 
                 address.includes('kumasi') || address.includes('tema');
        });

        const displayResults = ghanaResults.length > 0 ? ghanaResults : results.slice(0, 5);

        // Format results for display
        const formattedSuggestions = displayResults.map(result => ({
          formatted_address: result.formatted_address,
          location: result.geometry.location,
          place_id: result.place_id || `geo-${result.geometry.location.lat()}-${result.geometry.location.lng()}`
        }));
        
        setAddressSuggestions(formattedSuggestions);
        setShowSuggestions(formattedSuggestions.length > 0);
        setIsLoadingSuggestions(false);
      });
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
    }
  }, [googleMapsLoaded]);

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout with debounce (500ms)
    debounceTimeoutRef.current = setTimeout(() => {
      fetchAddressSuggestions(value);
    }, 500);
  };

  const handleAddressSuggestionSelect = (suggestion) => {
    setAddress(suggestion.formatted_address);
    setShowSuggestions(false);
    
    const lat = suggestion.location.lat();
    const lng = suggestion.location.lng();
    
    setLocation({ lat, lng });
    
    // Update the map through the onLocationSelect callback
    if (handleLocationSelect) {
      handleLocationSelect({ lat, lng });
    }
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

  const handleAddressSelect = (selectedAddress) => {
    setAddress(selectedAddress);
  };

  return (
    <div className="bg-gray-700/50 p-4 rounded-lg shadow-lg">
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

          <div className="relative z-50">
            <label className="block text-gray-300 mb-2">Address</label>
            <input
              ref={addressInputRef}
              type="text"
              value={address}
              onChange={handleAddressChange}
              onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-yellow-400"
              placeholder="Enter your restaurant's address"
            />
            {isLoadingSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-gray-700 rounded-lg border border-gray-600 shadow-lg p-2">
                <div className="flex items-center justify-center text-gray-400">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading locations...
                </div>
              </div>
            )}
            {showSuggestions && addressSuggestions.length > 0 && !isLoadingSuggestions && (
              <div 
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-gray-700 rounded-lg border border-gray-600 shadow-lg max-h-60 overflow-y-auto"
              >
                {addressSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 border-b border-gray-600 hover:bg-gray-600 cursor-pointer"
                    onClick={() => handleAddressSuggestionSelect(suggestion)}
                  >
                    <div className="font-medium">{suggestion.formatted_address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative z-10">
            <label className="block text-gray-300 mb-2">Location</label>
            <div className="h-64 bg-gray-800 rounded-lg overflow-hidden">
              <MapWithNoSSR 
                location={location}
                onLocationSelect={handleLocationSelect}
                onAddressSelect={handleAddressSelect}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Search for your restaurant above the map or type in the address field to see location suggestions
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
                  onAddressSelect={handleAddressSelect}
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