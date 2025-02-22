"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function RestaurantPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    if (!id) return;

    const fetchRestaurant = async () => {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        setRestaurant(data);
      } catch (err) {
        console.error("Error fetching restaurant:", err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchReservations = async () => {
      try {
        const { data, error } = await supabase
          .from("reservations")
          .select("*")
          .eq("restaurant_id", id)
          .eq("is_available", true)
          .order("date", { ascending: true })
          .order("time", { ascending: true });
        if (error) throw error;
        setReservations(data);
      } catch (err) {
        console.error("Error fetching reservations:", err.message);
      }
    };

    fetchRestaurant();
    fetchReservations();
  }, [id]);

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;
  if (!restaurant) return <p className="text-center text-red-500">Restaurant not found.</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 md:px-6 py-10 flex items-center justify-center">
      <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row gap-8 p-4 md:p-6 rounded-lg shadow-2xl bg-gray-800/90 backdrop-blur-md">
        
        {/* Left - Restaurant Image */}
        <div className="md:w-1/2">
          <img
            src={restaurant.restaurant_image || "/images/default.jpeg"}
            alt={restaurant.name}
            className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] object-cover rounded-lg shadow-lg"
          />
        </div>

        {/* Right - Content */}
        <div className="md:w-1/2 flex flex-col justify-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 mb-2">{restaurant.name}</h1>
          <p className="text-gray-300 text-sm sm:text-md md:text-lg">{restaurant.location}</p>
          <p className="mt-3 text-gray-300 leading-relaxed text-sm sm:text-md md:text-lg">
            {restaurant.description || "No description available."}
          </p>

          {/* Reservation Section */}
          <div className="mt-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-yellow-400 mb-3">Available Reservations</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {reservations.length > 0 ? (
                reservations.map((res) => (
                  <button
                    key={res.id}
                    className="px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-orange-500 hover:to-orange-700 transition-all rounded-lg shadow-md text-sm sm:text-lg font-semibold"
                  >
                    {new Date(res.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} @ {res.time.slice(0, 5)}
                  </button>
                ))
              ) : (
                <p className="text-gray-400 text-sm sm:text-md">No available slots.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}