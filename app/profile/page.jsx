'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [tablesAvailable, setTablesAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const fetchRestaurant = async () => {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user) return;
      
      const { data, error: restError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.user.id)
        .single();
      
      if (restError) return;
      setRestaurant(data);
      setTablesAvailable(data.tables_available);
    };

    fetchRestaurant();
  }, []);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!restaurant) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('date', { ascending: true });
      
      if (!error) setReservations(data);
      setLoading(false);
    };
    
    if (restaurant) fetchReservations();
  }, [restaurant]);

  const updateTables = async () => {
    const { error } = await supabase
      .from('restaurants')
      .update({ tables_available: tablesAvailable })
      .eq('id', restaurant.id);

    if (error) {
      toast.error('Failed to update tables');
    } else {
      toast.success('Tables updated successfully');
    }
  };

  const cancelReservation = async (id) => {
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (!error) {
      setReservations(reservations.filter(res => res.id !== id));
      toast.success('Reservation cancelled');
    } else {
      toast.error('Failed to cancel reservation');
    }
  };

  const filteredReservations = reservations.filter(res =>
    res.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterDate ? res.date === filterDate : true)
  );

  return (
    <div className="relative min-h-screen bg-cover bg-center p-6 flex flex-col items-center" style={{ backgroundImage: "url('/images/background.jpeg')" }}>
      <div className="absolute bg-black opacity-50"></div>
      <div className="relative z-10 w-full max-w-5xl text-white">
        <h1 className=" text-4xl sm:text-5xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-600 drop-shadow-lg text-center mb-8">Restaurant Dashboard</h1>

        <div className="mb-6 p-6 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
          <h2 className="text-2xl font-semibold">Update Tables Available</h2>
          <div className="mt-4 flex gap-3">
            <input 
              type="number" 
              value={tablesAvailable} 
              onChange={(e) => setTablesAvailable(e.target.value)} 
              className="p-3 border rounded-lg text-black w-24"
            />
            <button onClick={updateTables} className="bg-gold px-5 py-2 rounded-lg hover:bg-opacity-80 transition-all">
              Update
            </button>
          </div>
        </div>

        <div className="mb-6 p-6 bg-black bg-opacity-50 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold">Find Reservations</h2>
          <div className="mt-4 flex gap-4">
            <input 
              type="text" 
              placeholder="Search by Name" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-3 border rounded-lg text-black flex-1"
            />
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
              className="p-3 border rounded-lg text-black"
            />
          </div>
        </div>

        <h2 className="text-3xl font-semibold mb-4 text-center">Reservations</h2>
        {loading ? (
          <p className="text-center">Loading reservations...</p>
        ) : (
          filteredReservations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredReservations.map((res) => (
                <motion.div 
                  key={res.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="p-6 bg-white text-black rounded-xl shadow-xl relative"
                >
                  <h3 className="text-xl font-bold">{res.name}</h3>
                  <p><strong>Date:</strong> {new Date(res.date).toDateString()}</p>
                  <p><strong>Time:</strong> {res.time}</p>
                  <p><strong>Guests:</strong> {res.guest_count}</p>
                  <p><strong>Special Request:</strong> {res.special_request || 'None'}</p>
                  <button 
                    onClick={() => cancelReservation(res.id)}
                    className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-lg"
                  >
                    Cancel
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center">No reservations found.</p>
          )
        )}
      </div>
    </div>
  );
};

export default ProfilePage;