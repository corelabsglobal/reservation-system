'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Header from '../components/structure/header';
import { toast } from 'react-hot-toast';

const GuestReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [expandedRestaurant, setExpandedRestaurant] = useState(null);
  const [email, setEmail] = useState('');
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCheckReservation = async () => {
    setLoading(true);
    const reservationToken = localStorage.getItem('reservationToken');

    if (!reservationToken) {
      toast.error('No reservation found in local storage.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_token', reservationToken)
      .single();

    if (error || !data) {
      toast.error('No matching reservation found.');
      setLoading(false);
      return;
    }

    if (data.email !== email) {
      toast.error('Email does not match the reservation.');
      setLoading(false);
      return;
    }

    // Fetch all reservations for this email
    const { data: reservationsData, error: reservationsError } = await supabase
      .from('reservations')
      .select(`
        id, date, time, special_request, restaurant_id, name, occassion,
        restaurants:restaurant_id (id, name, location, restaurant_image)
      `)
      .eq('email', email);

    if (reservationsError) {
      toast.error('Error fetching reservations.');
    } else {
      setReservations(reservationsData);
      setVerified(true);
    }
    setLoading(false);
  };

  const groupedReservations = reservations.reduce((acc, res) => {
    if (!res.restaurants) return acc;
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
      <Header />
      <div className="bg-black bg-opacity-50 min-h-screen flex flex-col items-center py-10 px-5">
        <h1 className="mt-12 mb-8 text-4xl sm:text-5xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-600 drop-shadow-lg">
          Guest Reservations
        </h1>

        {!verified ? (
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-white max-w-md w-full">
            <p className="mb-4">Enter your email to view your reservations:</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 rounded-lg text-black"
            />
            <button
              onClick={handleCheckReservation}
              className="mt-4 w-full bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-600"
              disabled={loading}
            >
              {loading ? 'Checking...' : 'View Reservations'}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-4xl space-y-6">
            {Object.values(groupedReservations).map(({ restaurant, reservations }) => (
              <div key={restaurant.id} className="bg-gray-800 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-32 overflow-hidden rounded-lg">
                    <Image
                      src={restaurant?.restaurant_image || '/images/golden-lounge.jpeg'}
                      alt={restaurant.name}
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-yellow-400">{restaurant.name}</h2>
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
                        <p><strong>Booked For:</strong> {res.name || 'None'}</p>
                        <p><strong>Special Request:</strong> {res.special_request || 'None'}</p>
                        <p><strong>Occassion:</strong> {res.occassion || 'None'}</p>
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

export default GuestReservationsPage;