'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createCustomIcon = () => {
  return L.icon({
    iconUrl: '/images/marker-icon.png',
    iconRetinaUrl: '/images/marker-icon-2x.png',
    //shadowUrl: '/images/marker-shadow.png',
    shadowUrl: '/images/marker-icon.png',
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
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  const getCoordinates = () => {
    if (!location) return [DEFAULT_LAT, DEFAULT_LNG];
    const lat = location.lat ?? location.latitude ?? DEFAULT_LAT;
    const lng = location.lng ?? location.longitude ?? DEFAULT_LNG;
    return [lat, lng];
  };

  const handleSearch = async (query) => {
    if (!query) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const results = await response.json();
      
      // Clear previous results
      searchResultsRef.current.innerHTML = '';
      
      if (results.length === 0) {
        searchResultsRef.current.innerHTML = '<div class="p-2 text-gray-400">No results found</div>';
        return;
      }

      results.slice(0, 5).forEach(result => {
        const item = document.createElement('div');
        item.className = 'p-2 border-b border-gray-600 hover:bg-gray-600 cursor-pointer';
        item.innerHTML = `<div class="font-medium">${result.display_name.split(',')[0]}</div>
                         <div class="text-xs text-gray-400">${result.display_name}</div>`;
        item.addEventListener('click', () => {
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { icon: createCustomIcon() }).addTo(mapRef.current);
          }
          mapRef.current.setView([lat, lng], 16);
          if (onLocationSelect) {
            onLocationSelect({ lat, lng });
          }
          searchResultsRef.current.style.display = 'none';
        });
        searchResultsRef.current.appendChild(item);
      });
    } catch (error) {
      console.error('Search error:', error);
      searchResultsRef.current.innerHTML = '<div class="p-2 text-red-400">Error fetching results</div>';
    }
  };

  useEffect(() => {
    if (!mapRef.current) {
      const [lat, lng] = getCoordinates();
      const map = L.map('map-container').setView([lat, lng], DEFAULT_ZOOM);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Create search UI elements
      const searchContainer = document.createElement('div');
      searchContainer.className = 'absolute top-2 left-2 right-2 z-[1000]';
      searchContainer.innerHTML = `
        <div class="relative">
          <input 
            type="text" 
            placeholder="Search for restaurant location..." 
            class="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
          />
          <div class="absolute right-3 top-3 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div class="absolute z-10 w-full mt-1 bg-gray-700 rounded-lg border border-gray-600 shadow-lg hidden max-h-60 overflow-y-auto"></div>
        </div>
      `;
      map.getContainer().appendChild(searchContainer);

      searchInputRef.current = searchContainer.querySelector('input');
      searchResultsRef.current = searchContainer.querySelector('div > div:last-child');

      // Set up search event listeners
      let searchTimeout;
      searchInputRef.current.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          if (e.target.value.trim()) {
            handleSearch(e.target.value);
            searchResultsRef.current.style.display = 'block';
          } else {
            searchResultsRef.current.style.display = 'none';
          }
        }, 500);
      });

      // Close results when clicking outside
      document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
          searchResultsRef.current.style.display = 'none';
        }
      });

      if (location && (location.lat || location.latitude) && (location.lng || location.longitude)) {
        markerRef.current = L.marker([lat, lng], { icon: createCustomIcon() }).addTo(map);
      }

      if (interactive) {
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { icon: createCustomIcon() }).addTo(map);
          }
          if (onLocationSelect) {
            onLocationSelect({ lat, lng });
          }
        });
      }

      mapRef.current = map;

      return () => {
        document.removeEventListener('click', () => {});
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
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else if (location) {
        markerRef.current = L.marker([lat, lng], { icon: createCustomIcon() }).addTo(mapRef.current);
      }
    }
  }, [location]);

  return <div id="map-container" style={{ height: '100%', width: '100%', position: 'relative' }} />;
};

export default Map;