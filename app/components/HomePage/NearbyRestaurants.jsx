"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

export const NearbyRestaurants = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
              );
              const data = await response.json();
              
              setUserLocation({
                city: data.address.city || data.address.town || data.address.village,
                region: data.address.state,
                country: data.address.country,
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            } catch (error) {
              console.error("Error getting location:", error);
              setUserLocation({ city: "Accra", region: "Greater Accra", country: "Ghana" });
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            setUserLocation({ city: "Accra", region: "Greater Accra", country: "Ghana" });
          }
        );
      } else {
        setUserLocation({ city: "Accra", region: "Greater Accra", country: "Ghana" });
      }
    };

    getLocation();
  }, []);

  // Fetch nearby restaurants based on location
  useEffect(() => {
    if (!userLocation) return;

    const fetchNearbyRestaurants = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from("restaurants")
          .select("*")
          .eq("verified", true)
          .ilike("location", `%${userLocation.city}%`);

        const { data, error } = await query;
        
        if (error) throw error;
        setNearbyRestaurants(data || []);
      } catch (err) {
        console.error("Error fetching nearby restaurants:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyRestaurants();
  }, [userLocation]);

  const nextSlide = () => {
    setCurrentSlide((prev) => 
      prev === nearbyRestaurants.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => 
      prev === 0 ? nearbyRestaurants.length - 1 : prev - 1
    );
  };

  if (loading || !userLocation || nearbyRestaurants.length === 0) return null;

  return (
    <div className="relative mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          <MapPin className="inline mr-2 text-yellow-400" />
          Top picks in {userLocation.city}
        </h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={prevSlide}
            className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={nextSlide}
            className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="relative h-96 overflow-hidden rounded-xl">
        <motion.div
          className="absolute inset-0 flex"
          animate={{ x: `-${currentSlide * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {nearbyRestaurants.map((restaurant, index) => (
            <div key={restaurant.id} className="w-full flex-shrink-0 px-2">
              <motion.div
                className="relative h-full bg-gray-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md"
                whileHover={{ scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                <img
                  src={restaurant.restaurant_image || "/images/golden-lounge.jpeg"}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h3 className="text-2xl font-bold text-white">{restaurant.name}</h3>
                  <p className="text-gray-300 mb-4">{restaurant.location}</p>
                  <Button 
                    className="bg-gradient-to-r from-yellow-400 to-orange-600 hover:from-orange-500 hover:to-orange-700"
                    onClick={() => window.location.href = `/restaurants/${restaurant.id}`}
                  >
                    Book Now
                  </Button>
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="flex justify-center mt-4 space-x-2">
        {nearbyRestaurants.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              index === currentSlide ? "bg-yellow-400 w-6" : "bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
};