'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

const ReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [expandedRestaurant, setExpandedRestaurant] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      console.log("User Data:", userData.user); // ✅ Debugging step
      setUser(userData.user);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!user?.id) return;

      setLoading(true);
      console.log("Fetching reservations for user:", user.id);

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id, date, time, special_request, restaurant_id,
          restaurants:restaurant_id (id, name, location, restaurant_image)
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching reservations:", error);
      } else {
        console.log("Fetched Reservations:", data);
        setReservations(data);
      }
      setLoading(false);
    };

    if (user) {
      fetchReservations();
    }
  }, [user]);

  // Group reservations by restaurant
  const groupedReservations = reservations.reduce((acc, res) => {
    if (!res.restaurants) return acc; // Ensure restaurant data exists

    const restaurantId = res.restaurants.id;
    if (!acc[restaurantId]) {
      acc[restaurantId] = {
        restaurant: res.restaurants,
        reservations: [],
      };
    }
    acc[restaurantId].reservations.push(res);
    return acc;
  }, {});

  return (
    <div className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/background.jpeg)' }}>
      <div className="bg-black bg-opacity-50 min-h-screen flex flex-col items-center py-10 px-5">
        <h1 className="text-4xl font-bold text-white mb-8">Your Reservations</h1>

        {loading ? (
          <p className="text-white">Loading reservations...</p>
        ) : (
          <div className="w-full max-w-4xl space-y-6">
            {Object.values(groupedReservations).map(({ restaurant, reservations }) => (
              <div key={restaurant.id} className="bg-gray-800 p-6 rounded-lg shadow-lg text-white">
                <div className="flex items-center space-x-4">
                  <Image
                    src={restaurant?.restaurant_image || "/images/golden-lounge.jpeg"}
                    alt={restaurant.name}
                    width={80}
                    height={80}
                    className="rounded-lg"
                    onError={(e) => (e.target.src = "/images/golden-lounge.jpeg")}
                  />
                  <div>
                    <h2 className="text-2xl font-semibold">{restaurant.name}</h2>
                    <p className="text-gray-400">{restaurant.location}</p>
                  </div>
                </div>
                <div className="mt-4">
                  {reservations.length > 1 && (
                    <button
                      className="text-yellow-400 underline"
                      onClick={() => setExpandedRestaurant(expandedRestaurant === restaurant.id ? null : restaurant.id)}
                    >
                      {expandedRestaurant === restaurant.id ? 'Hide Reservations' : 'View All Reservations'}
                    </button>
                  )}
                  <div className={`${expandedRestaurant === restaurant.id || reservations.length === 1 ? 'block' : 'hidden'}`}>
                    {reservations.map((res) => (
                      <div key={res.id} className="mt-4 p-4 bg-gray-700 rounded-md">
                        <p><strong>Date:</strong> {new Date(res.date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {res.time}</p>
                        <p><strong>Special Request:</strong> {res.special_request || 'None'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationsPage;