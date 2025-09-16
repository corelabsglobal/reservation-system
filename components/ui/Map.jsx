'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_LAT = 5.6037;
const DEFAULT_LNG = -0.1870;
const DEFAULT_ZOOM = 15;

const Map = ({ location, onLocationSelect, onAddressSelect, interactive = true }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);
  const geocoderRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const getCoordinates = () => {
    if (!location) return { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
    const lat = location.lat ?? location.latitude ?? DEFAULT_LAT;
    const lng = location.lng ?? location.longitude ?? DEFAULT_LNG;
    return { lat, lng };
  };

  const handleSearch = (query) => {
    if (!query || !geocoderRef.current) return;
    
    // First try to search globally
    geocoderRef.current.geocode({
      address: query
    }, (results, status) => {
      // Clear previous results
      if (searchResultsRef.current) {
        searchResultsRef.current.innerHTML = '';
      }
      
      if (status !== window.google.maps.GeocoderStatus.OK || !results || results.length === 0) {
        if (searchResultsRef.current) {
          searchResultsRef.current.innerHTML = '<div class="p-2 text-gray-400">No results found</div>';
        }
        return;
      }

      // Filter and prioritize Ghana results
      const ghanaResults = results.filter(result => {
        const address = result.formatted_address.toLowerCase();
        return address.includes('ghana') || address.includes('accra') || 
               address.includes('kumasi') || address.includes('tema');
      });

      const displayResults = ghanaResults.length > 0 ? ghanaResults : results.slice(0, 5);

      displayResults.forEach(result => {
        const item = document.createElement('div');
        item.className = 'p-2 border-b border-gray-600 hover:bg-gray-600 cursor-pointer';
        item.innerHTML = `<div class="font-medium">${result.formatted_address}</div>`;
        item.addEventListener('click', () => {
          const location = result.geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          // Remove existing marker if it exists
          if (markerRef.current) {
            markerRef.current.setMap(null);
          }
          
          // Create new marker
          markerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapRef.current,
            icon: {
              url: '/images/marker-logo.png',
              scaledSize: new window.google.maps.Size(25, 41),
              anchor: new window.google.maps.Point(12, 41)
            },
            animation: window.google.maps.Animation.DROP
          });
          
          // Zoom to the location
          mapRef.current.setCenter({ lat, lng });
          mapRef.current.setZoom(16);
          
          // Update the location state
          if (onLocationSelect) {
            onLocationSelect({ lat, lng });
          }

          if (onAddressSelect) {
            onAddressSelect(result.formatted_address);
          }
          
          // Hide search results
          if (searchResultsRef.current) {
            searchResultsRef.current.style.display = 'none';
          }
          if (searchInputRef.current) {
            searchInputRef.current.value = result.formatted_address;
          }
        });
        if (searchResultsRef.current) {
          searchResultsRef.current.appendChild(item);
        }
      });
    });
  };

  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
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
        setMapLoaded(true);
        initializeMap();
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    } else if (window.google && window.google.maps) {
      // Script is already loaded, initialize map
      setMapLoaded(true);
      initializeMap();
    } else {
      // Script is loading, wait for it
      existingScript.onload = () => {
        setMapLoaded(true);
        initializeMap();
      };
    }

    function initializeMap() {
      // Check if map container exists and Google Maps is loaded
      const mapContainer = document.getElementById('map-container');
      if (!mapContainer || !window.google || !window.google.maps) {
        return;
      }

      if (!mapRef.current) {
        const { lat, lng } = getCoordinates();
        const map = new window.google.maps.Map(mapContainer, {
          center: { lat, lng },
          zoom: DEFAULT_ZOOM,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        // Initialize services
        geocoderRef.current = new window.google.maps.Geocoder();

        // Create search UI elements
        const searchContainer = document.createElement('div');
        searchContainer.className = 'absolute top-2 left-2 right-2 z-[1000]';
        searchContainer.innerHTML = `
          <div class="relative">
            <input 
              type="text" 
              placeholder="Search for locations..." 
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
        mapContainer.appendChild(searchContainer);

        searchInputRef.current = searchContainer.querySelector('input');
        searchResultsRef.current = searchContainer.querySelector('div > div:last-child');

        // Set up search event listeners
        let searchTimeout;
        if (searchInputRef.current) {
          searchInputRef.current.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
              if (e.target.value.trim()) {
                handleSearch(e.target.value);
                if (searchResultsRef.current) {
                  searchResultsRef.current.style.display = 'block';
                }
              } else {
                if (searchResultsRef.current) {
                  searchResultsRef.current.style.display = 'none';
                }
              }
            }, 500);
          });
        }

        // Close results when clicking outside
        document.addEventListener('click', (e) => {
          if (searchContainer && !searchContainer.contains(e.target) && searchResultsRef.current) {
            searchResultsRef.current.style.display = 'none';
          }
        });

        // Initialize marker if location exists
        if (location && (location.lat || location.latitude) && (location.lng || location.longitude)) {
          const { lat, lng } = getCoordinates();
          markerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: map,
            icon: {
              url: '/images/marker-logo.png',
              scaledSize: new window.google.maps.Size(25, 41),
              anchor: new window.google.maps.Point(12, 41)
            }
          });
        }

        if (interactive) {
          map.addListener('click', (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            
            // Remove existing marker if it exists
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }
            
            // Create new marker
            markerRef.current = new window.google.maps.Marker({
              position: { lat, lng },
              map: map,
              icon: {
                url: '/images/marker-logo.png',
                scaledSize: new window.google.maps.Size(25, 41),
                anchor: new window.google.maps.Point(12, 41)
              },
              animation: window.google.maps.Animation.DROP
            });
            
            if (onLocationSelect) {
              onLocationSelect({ lat, lng });
            }
            
            // Reverse geocode to get address
            geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results[0]) {
                if (onAddressSelect) {
                  onAddressSelect(results[0].formatted_address);
                }
                if (searchInputRef.current) {
                  searchInputRef.current.value = results[0].formatted_address;
                }
              }
            });
          });
        }

        mapRef.current = map;
      }
    }

    return () => {
      document.removeEventListener('click', () => {});
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [mapLoaded]);

  useEffect(() => {
    if (mapRef.current && location) {
      const { lat, lng } = getCoordinates();
      mapRef.current.setCenter({ lat, lng });
      
      // Remove existing marker if it exists
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      
      // Create new marker
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapRef.current,
        icon: {
          url: '/images/marker-logo.png',
          scaledSize: new window.google.maps.Size(25, 41),
          anchor: new window.google.maps.Point(12, 41)
        }
      });
    }
  }, [location]);

  return <div id="map-container" style={{ height: '100%', width: '100%', position: 'relative' }} />;
};

export default Map;