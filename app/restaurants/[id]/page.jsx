"use client"; 

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function RestaurantPage() {
  const router = useRouter();
  const { id } = useParams();;
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

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

    fetchRestaurant();
  }, [id]);

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;
  if (!restaurant) return <p className="text-center text-red-500">Restaurant not found.</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <img src={restaurant.restaurant_image || "/images/default.jpeg"} alt={restaurant.name} className="w-full h-64 object-cover rounded-lg shadow-lg"/>
        <h1 className="text-4xl font-bold text-yellow-400 mt-6">{restaurant.name}</h1>
        <p className="text-gray-300 mt-2">{restaurant.location}</p>
        <p className="mt-4">{restaurant.description || "No description available."}</p>

        {/* Reservation Button */}
        <Button className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 transition-all">
          Make a Reservation
        </Button>
      </div>
    </div>
  );
}