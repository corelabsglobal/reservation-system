"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Header from "./components/structure/header";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User } from "lucide-react";
import { NearbyRestaurants } from "./components/HomePage/NearbyRestaurants";
import { usePreviousDayReservationCheck, RatingModal } from "./components/HomePage/RatingModal";

export default function Home() {
  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const ratingModal = usePreviousDayReservationCheck();
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("verified", true)
          .order("name", { ascending: true });
        
        if (error) throw error;
        setRestaurants(data);
      } catch (err) {
        console.error("Error fetching restaurants: ", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // Function to truncate text to a single line
  const truncateText = (text, maxLength = 35) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const filteredRestaurants = useMemo(() => {
    if (!search) return restaurants;
    
    const searchTerm = search.toLowerCase();
    return restaurants.filter(restaurant => {
      return (
        restaurant.name.toLowerCase().includes(searchTerm) ||
        (restaurant.location && restaurant.location.toLowerCase().includes(searchTerm))
      );
    });
  }, [restaurants, search]);

  const handleBooking = async (restaurantId) => {
    router.push(`/restaurants/${restaurantId}`);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 to-black text-white px-6 py-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-50"
        style={{ backgroundImage: "url('/images/background.jpeg')" }}
      />
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0.2)_0%,rgba(0,0,0,0)_70%)] opacity-40 pointer-events-none"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      />

      <Header />

      <div className="max-w-6xl mx-auto relative z-10 pt-8 lg:pt-12">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-600 drop-shadow-lg">
            Discover & Book Luxury Dining
          </h1>
          <p className="text-gray-300 mt-4 text-base sm:text-lg italic">
            Experience the finest tables all with Danloski
          </p>
        </motion.div>

        <NearbyRestaurants />

        <motion.div
          className="flex items-center bg-gray-800 p-3 rounded-xl mb-8 shadow-lg backdrop-blur-md"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Search className="text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants by name or location..."
            className="bg-transparent outline-none px-3 py-1 text-white w-full placeholder-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filteredRestaurants.length > 0) {
                handleBooking(filteredRestaurants[0].id);
              }
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-white mr-2"
            >
              ✕
            </button>
          )}
        </motion.div>

        {/* Search Results Info */}
        {search && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 text-gray-300"
          >
            Showing {filteredRestaurants.length} result{filteredRestaurants.length !== 1 ? "s" : ""} for "{search}"
          </motion.div>
        )}

        {/* Restaurant Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {filteredRestaurants.length > 0 ? (
              filteredRestaurants.map((restaurant) => (
                <motion.div
                  key={restaurant.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md hover:shadow-yellow-400/30 transition-all duration-300"
                  layout // Add layout animation
                >
                  <motion.img
                    src={restaurant.restaurant_image || "/images/placeholder.jpg"}
                    alt={restaurant.name}
                    className="w-full h-56 object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  <CardContent className="p-5">
                    <h2 className="text-2xl font-bold text-yellow-400">
                      {restaurant.name}
                    </h2>
                    <p className="text-gray-300 truncate" title={restaurant.address || restaurant.location}>
                      {truncateText(restaurant.address || restaurant.location)}
                    </p>
                    <Button 
                      className="mt-4 w-full bg-gradient-to-r from-yellow-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 transition-all "
                      onClick={() => handleBooking(restaurant.id)}
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </motion.div>
              ))
            ) : (
              <motion.div 
                className="text-center text-gray-400 col-span-3 py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {search ? (
                  <>
                    <p className="text-lg">No restaurants found matching "{search}"</p>
                    <Button 
                      variant="ghost" 
                      className="mt-4 text-yellow-400"
                      onClick={() => setSearch("")}
                    >
                      Clear search
                    </Button>
                  </>
                ) : (
                  <p>No restaurants available at the moment</p>
                )}
              </motion.div>
            )}
          </div>
        )}

        {ratingModal.showRatingModal && (
          <RatingModal
            reservation={ratingModal.reservationToRate}
            restaurant={ratingModal.restaurant}
            onClose={ratingModal.onClose}
            onSubmit={ratingModal.onSubmitRating}
          />
        )}

        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-gray-900 text-white p-6 rounded-lg shadow-xl max-w-sm text-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-gray-300 mb-4">
                Please sign in to continue booking your dining experience.
              </p>
              <Button
                className="bg-yellow-500 hover:bg-yellow-600 transition-all"
                onClick={() => router.push("/signin")}
              >
                Go to Sign In
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}