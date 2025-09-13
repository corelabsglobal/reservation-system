'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create custom marker icon
const createCustomIcon = () => {
  return L.icon({
    iconUrl: '/images/marker-icon-2x.jpg',
    iconRetinaUrl: '/images/marker-logo.png',
    //shadowUrl: '/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const DEFAULT_LAT = 5.6037;
const DEFAULT_LNG = -0.1870;
const DEFAULT_ZOOM = 15;

const Map = ({ location, onLocationSelect, interactive = true }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const getCoordinates = () => {
    if (!location) return [DEFAULT_LAT, DEFAULT_LNG];
    const lat = location.lat ?? location.latitude ?? DEFAULT_LAT;
    const lng = location.lng ?? location.longitude ?? DEFAULT_LNG;
    return [lat, lng];
  };

  useEffect(() => {
    if (!mapRef.current) {
      const [lat, lng] = getCoordinates();
      const map = L.map('map-container').setView([lat, lng], DEFAULT_ZOOM);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Initialize marker if location exists
      if (location && (location.lat || location.latitude) && (location.lng || location.longitude)) {
        const [lat, lng] = getCoordinates();
        markerRef.current = L.marker([lat, lng], { 
          icon: createCustomIcon(),
          riseOnHover: true
        }).addTo(map);
      }

      if (interactive) {
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          // Remove existing marker if it exists
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }
          // Create new marker
          markerRef.current = L.marker([lat, lng], { 
            icon: createCustomIcon(),
            riseOnHover: true
          }).addTo(map);
          if (onLocationSelect) {
            onLocationSelect({ lat, lng });
          }
        });
      }

      mapRef.current = map;

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && location) {
      const [lat, lng] = getCoordinates();
      mapRef.current.setView([lat, lng], DEFAULT_ZOOM);
      // Remove existing marker if it exists
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
      }
      // Create new marker
      markerRef.current = L.marker([lat, lng], { 
        icon: createCustomIcon(),
        riseOnHover: true
      }).addTo(mapRef.current);
    }
  }, [location]);

  return <div id="map-container" style={{ height: '100%', width: '100%', position: 'relative' }} />;
};

export default Map;