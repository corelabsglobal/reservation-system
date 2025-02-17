"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function Home() {
  const [search, setSearch] = useState("");
  const restaurants = [
    {
      id: 1,
      name: "The Grand Dine",
      location: "Downtown, LA",
      image: "/images/grand-dine.jpeg",
    },
    {
      id: 2,
      name: "Skyline Lounge",
      location: "New York City",
      image: "/images/lounge.jpeg",
    },
    {
      id: 3,
      name: "Golden Fork",
      location: "San Francisco",
      image: "/images/golden-lounge.jpeg",
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 to-black text-white px-6 py-10 overflow-hidden">
      {/* Floating Light Effect */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0.2)_0%,rgba(0,0,0,0)_70%)] opacity-40 pointer-events-none"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-600 drop-shadow-lg">
            Discover & Book Luxury Dining
          </h1>
          <p className="text-gray-300 mt-4 text-lg">
            Reserve your exclusive dining experience at the finest restaurants.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="flex items-center bg-gray-800 p-4 rounded-xl mb-8 shadow-lg backdrop-blur-md"
          whileHover={{ scale: 1.05 }}
        >
          <Search className="text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants..."
            className="bg-transparent outline-none px-3 text-white w-full placeholder-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button className="ml-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all">
            Search
          </Button>
        </motion.div>

        {/* Restaurant Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {restaurants.map((restaurant) => (
            <motion.div
              key={restaurant.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md hover:shadow-yellow-400/30 transition-all duration-500"
            >
              <motion.img
                src={restaurant.image}
                alt={restaurant.name}
                className="w-full h-56 object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
              />
              <CardContent className="p-5">
                <h2 className="text-2xl font-bold text-yellow-400">
                  {restaurant.name}
                </h2>
                <p className="text-gray-300">{restaurant.location}</p>
                <Button className="mt-4 w-full bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 transition-all">
                  Book Now
                </Button>
              </CardContent>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}