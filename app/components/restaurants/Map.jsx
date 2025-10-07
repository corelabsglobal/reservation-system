'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_LAT = 5.6037;
const DEFAULT_LNG = -0.1870;
const DEFAULT_ZOOM = 15;

const Map = ({ location }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const normalizeLocation = (location) => {
    if (!location) return null;

    if (typeof location === "string") {
      try {
        return JSON.parse(location);
      } catch (e) {
        console.error("Invalid location JSON:", e);
        return null;
      }
    }

    return location;
  };

  const getCoordinates = () => {
    const parsedLocation = normalizeLocation(location);

    if (!parsedLocation) return { lat: DEFAULT_LAT, lng: DEFAULT_LNG };

    const lat = parsedLocation.lat ?? parsedLocation.latitude ?? DEFAULT_LAT;
    const lng = parsedLocation.lng ?? parsedLocation.longitude ?? DEFAULT_LNG;

    return { lat, lng };
  };

  useEffect(() => {
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
      script.onload = () => initializeMap();
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    } else if (window.google && window.google.maps) {
      // Script is already loaded, initialize map
      initializeMap();
    } else {
      // Script is loading, wait for it
      existingScript.onload = () => initializeMap();
    }

    function initializeMap() {
      // Check if map container exists and Google Maps is loaded
      const mapContainer = document.getElementById('map-display-container');
      if (!mapContainer || !window.google || !window.google.maps) {
        return;
      }

      const { lat, lng } = getCoordinates();
      
      // Initialize the map
      const map = new window.google.maps.Map(mapContainer, {
        center: { lat, lng },
        zoom: DEFAULT_ZOOM,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            "featureType": "all",
            "elementType": "geometry",
            "stylers": [{ "color": "#242f3e" }]
          },
          {
            "featureType": "all",
            "elementType": "labels.text.stroke",
            "stylers": [{ "lightness": -80 }]
          },
          {
            "featureType": "administrative",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#746855" }]
          },
          {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{ "color": "#2c3e50" }]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#d59563" }]
          },
          {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#38414e" }]
          },
          {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#9ca5b3" }]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#17263c" }]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#515c6d" }]
          }
        ]
      });

      // Create marker
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        icon: {
          url: '/images/marker-logo.png',
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        },
        animation: window.google.maps.Animation.DROP
      });

      map.addListener("click", (e) => {
        const clickedLat = e.latLng.lat();
        const clickedLng = e.latLng.lng();

        const googleMapsUrl = `https://www.google.com/maps?q=${clickedLat},${clickedLng}`;

        const shouldOpen = window.confirm("Do you want to open this location in Google Maps?");
        if (shouldOpen) {
          window.open(googleMapsUrl, "_blank");
        }
      });

      mapRef.current = map;
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

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
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        }
      });
    }
  }, [location]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
      <div id="map-display-container" style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default Map;