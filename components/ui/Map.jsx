'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

// Default coordinates (Accra, Ghana)
const DEFAULT_LAT = 5.6037;
const DEFAULT_LNG = -0.1870;
const DEFAULT_ZOOM = 15;

const Map = ({ location, onLocationSelect, interactive = true }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Safely get coordinates from location prop
  const getCoordinates = () => {
    if (!location) return [DEFAULT_LAT, DEFAULT_LNG];
    
    // Handle both {lat, lng} and {latitude, longitude} formats
    const lat = location.lat ?? location.latitude ?? DEFAULT_LAT;
    const lng = location.lng ?? location.longitude ?? DEFAULT_LNG;
    
    return [lat, lng];
  };

  useEffect(() => {
    if (!mapRef.current) {
      const [lat, lng] = getCoordinates();
      
      // Initialize map with safe coordinates
      const map = L.map('map').setView([lat, lng], DEFAULT_ZOOM);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapRef.current = map;

      // Add marker if location is valid
      if (location && (location.lat || location.latitude) && (location.lng || location.longitude)) {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }

      if (interactive) {
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng]).addTo(map);
          }
          if (onLocationSelect) {
            onLocationSelect({ lat, lng });
          }
        });
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position when location prop changes
  useEffect(() => {
    if (mapRef.current && location) {
      const [lat, lng] = getCoordinates();
      mapRef.current.setView([lat, lng], DEFAULT_ZOOM);
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else if (location) {
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
      }
    }
  }, [location]);

  return <div id="map" style={{ height: '100%', width: '100%' }} />;
};

export default Map;