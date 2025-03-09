'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Header from '../components/structure/header';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie } from 'recharts';
import SubscriptionManager from '../components/structure/hooks/SubscriptionManager';

const ProfilePage = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [tablesAvailable, setTablesAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllReservations, setShowAllReservations] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setTablesAvailable(data.tables);
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
      .update({ tables: tablesAvailable })
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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
  
      if (data.url) {
        setNewImage(data.url);
        toast.success('Image uploaded to Cloudinary');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      toast.error('Error uploading image');
      console.error(error);
    }
  };

  const updateRestaurantImage = async () => {
    if (!newImage) return;
  
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ image: newImage })
        .eq('id', restaurant.id);
  
      if (error) {
        toast.error('Failed to update image in Supabase');
      } else {
        toast.success('Image updated successfully');
        setRestaurant({ ...restaurant, image: newImage });
        setNewImage(null);
      }
    } catch (error) {
      toast.error('Error updating image');
      console.error(error);
    }
  };

  const reservationData = reservations.reduce((acc, res) => {
    const month = new Date(res.date).toLocaleString('default', { month: 'long' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(reservationData).map(month => ({
    month,
    reservations: reservationData[month]
  }));

  return (
    <div className="relative min-h-screen bg-cover bg-center bg-fixed p-6 flex flex-col items-center" style={{ backgroundImage: "url('/images/background.jpeg')" }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
        <Header />
        <div className="text-center mt-14">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-600 drop-shadow-lg mb-8">
              Dashboard
            </h1>
        </div>
        {/*restaurant && <SubscriptionManager restaurant={restaurant} />*/}
      <div className="relative z-10 w-full max-w-5xl text-white">
        {/* Navbar */}
        <nav className="flex flex-wrap justify-center gap-2 mb-8">
          {['overview', 'customers', 'reservations', 'manage'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm sm:text-base transition-all ${
                activeTab === tab ? 'bg-gradient-to-r from-yellow-400 to-pink-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="mb-6 p-6 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
            <h2 className="text-2xl font-semibold mb-6">Reservation Overview</h2>

            {/* Circle Charts Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Chart 1: Reservation Status Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="p-6 bg-gray-700/50 rounded-xl shadow-lg"
              >
                <h3 className="text-lg font-semibold mb-4">Reservation Status</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Confirmed', value: 70, fill: '#4ADE80' },
                        { name: 'Pending', value: 20, fill: '#FBBF24' },
                        { name: 'Canceled', value: 10, fill: '#EF4444' },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      label
                    >
                      {[
                        { name: 'Confirmed', fill: '#4ADE80' },
                        { name: 'Pending', fill: '#FBBF24' },
                        { name: 'Canceled', fill: '#EF4444' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '8px' }} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', color: '#CBD5E0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Chart 2: Customer Type Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="p-6 bg-gray-700/50 rounded-xl shadow-lg"
              >
                <h3 className="text-lg font-semibold mb-4">Customer Type</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'New Customers', value: 60, fill: '#60A5FA' },
                        { name: 'Returning Customers', value: 40, fill: '#A78BFA' },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      label
                    >
                      {[
                        { name: 'New Customers', fill: '#60A5FA' },
                        { name: 'Returning Customers', fill: '#A78BFA' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '8px' }} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', color: '#CBD5E0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Chart 3: Peak Reservation Times */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="p-6 bg-gray-700/50 rounded-xl shadow-lg"
              >
                <h3 className="text-lg font-semibold mb-4">Peak Times</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Morning', value: 30, fill: '#F472B6' },
                        { name: 'Afternoon', value: 50, fill: '#FB923C' },
                        { name: 'Evening', value: 20, fill: '#818CF8' },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      label
                    >
                      {[
                        { name: 'Morning', fill: '#F472B6' },
                        { name: 'Afternoon', fill: '#FB923C' },
                        { name: 'Evening', fill: '#818CF8' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '8px' }} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', color: '#CBD5E0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="w-full h-64 sm:h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                  <XAxis dataKey="month" stroke="#CBD5E0" />
                  <YAxis stroke="#CBD5E0" />
                  <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Bar
                    dataKey="reservations"
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="mb-6 p-6 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
            <h2 className="text-2xl font-semibold mb-4">Customers</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res) => (
                    <tr key={res.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-all">
                      <td className="px-4 py-3">{res.name}</td>
                      <td className="px-4 py-3">{res.email}</td>
                      <td className="px-4 py-3">{res.number ? `0${res.number}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="mb-6 p-6 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
            <h2 className="text-2xl font-semibold mb-4">Reservations</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
            <div className="space-y-4">
              {filteredReservations.slice(0, showAllReservations ? filteredReservations.length : 5).map((res) => (
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
                  <p><strong>Guests:</strong> {res.people}</p>
                  <p><strong>Special Request:</strong> {res.special_request || 'None'}</p>
                  <p><strong>Occasion:</strong> {res.occassion || 'None'}</p>
                  <button
                    onClick={() => cancelReservation(res.id)}
                    className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-all"
                  >
                    Cancel
                  </button>
                </motion.div>
              ))}
              {filteredReservations.length > 5 && (
                <button
                  onClick={() => setShowAllReservations(!showAllReservations)}
                  className="mt-4 bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-2 rounded-lg hover:opacity-80 transition-all"
                >
                  {showAllReservations ? 'Show Less' : 'Show More'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="mb-6 p-6 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
            <h2 className="text-2xl font-semibold mb-4">Manage Restaurant</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Update Restaurant Image</h3>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={restaurant?.image || '/images/lounge.jpeg'}
                    alt="Restaurant"
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                  <input
                    type="file"
                    onChange={handleImageChange}
                    className="mt-2 sm:mt-0"
                  />
                  {newImage && (
                    <button
                      onClick={updateRestaurantImage}
                      className="bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-2 rounded-lg hover:opacity-80 transition-all"
                    >
                      Update Image
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Update Tables Available</h3>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={tablesAvailable}
                    onChange={(e) => setTablesAvailable(e.target.value)}
                    className="p-2 border rounded-lg text-black w-24"
                  />
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-2 rounded-lg hover:opacity-80 transition-all"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Modal for Confirmation */}
            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full"
                >
                  <h3 className="text-xl font-semibold mb-4">Confirm Update</h3>
                  <p className="mb-6">Are you sure you want to update the number of tables?</p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        updateTables();
                        setIsModalOpen(false);
                      }}
                      className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded-lg hover:opacity-80 transition-all"
                    >
                      Confirm
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;