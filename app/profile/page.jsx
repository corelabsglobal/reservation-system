'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Header from '../components/structure/header';
import SubscriptionManager from '../components/structure/hooks/SubscriptionManager';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie } from 'recharts';

const ProfilePage = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllReservations, setShowAllReservations] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingCostInput, setBookingCostInput] = useState(0);
  const [lastVisit, setLastVisit] = useState(null);
  
  // New state for table management
  const [tableTypes, setTableTypes] = useState([]);
  const [tables, setTables] = useState([]);
  const [newTableType, setNewTableType] = useState({
    name: '',
    capacity: 2,
    description: ''
  });
  const [newTable, setNewTable] = useState({
    table_type_id: '',
    table_number: '',
    position_description: ''
  });

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
      setBookingCostInput(data.booking_cost || 0);
    };

    fetchRestaurant();
  }, []);

  const markAsSeen = async (reservationId) => {
    const { error } = await supabase
      .from('reservations')
      .update({ is_new: false })
      .eq('id', reservationId);
    
    if (!error) {
      setReservations(reservations.map(res => 
        res.id === reservationId ? { ...res, is_new: false } : res
      ));
    }
  };
  
  useEffect(() => {
    const fetchReservations = async () => {
      if (!restaurant) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*, tables(table_number)')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });
  
      if (!error) {
        const markedData = data.map(res => ({
          ...res,
          table_number: res.tables?.table_number,
          is_new: lastVisit ? new Date(res.created_at) > new Date(lastVisit) : false
        }));
        setReservations(markedData);
        setLastVisit(new Date().toISOString());
      }
      setLoading(false);
    };
    
    if (restaurant) fetchReservations();
  }, [restaurant]);

  useEffect(() => {
    const fetchTableData = async () => {
      if (!restaurant) return;
      
      // Fetch table types
      const { data: typesData, error: typesError } = await supabase
        .from('table_types')
        .select('*')
        .eq('restaurant_id', restaurant.id);
      
      if (!typesError) setTableTypes(typesData);
      
      // Fetch tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*, table_types(*)')
        .eq('restaurant_id', restaurant.id);
      
      if (!tablesError) setTables(tablesData);
    };
    
    if (restaurant) fetchTableData();
  }, [restaurant]);

  // Table Type Management Functions
  const addTableType = async () => {
    if (!newTableType.name || !newTableType.capacity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { data, error } = await supabase
      .from('table_types')
      .insert([{ ...newTableType, restaurant_id: restaurant.id }])
      .select();
    
    if (error) {
      toast.error('Failed to add table type');
    } else {
      toast.success('Table type added successfully');
      setTableTypes([...tableTypes, data[0]]);
      setNewTableType({ name: '', capacity: 2, description: '' });
    }
  };

  const deleteTableType = async (typeId) => {
    // First check if any tables use this type
    const { count } = await supabase
      .from('tables')
      .select('*', { count: 'exact' })
      .eq('table_type_id', typeId);
    
    if (count > 0) {
      toast.error('Cannot delete table type - tables are assigned to it');
      return;
    }
    
    const { error } = await supabase
      .from('table_types')
      .delete()
      .eq('id', typeId);
    
    if (error) {
      toast.error('Failed to delete table type');
    } else {
      toast.success('Table type deleted successfully');
      setTableTypes(tableTypes.filter(type => type.id !== typeId));
    }
  };

  // Table Management Functions
  const addTable = async () => {
    if (!newTable.table_type_id || !newTable.table_number) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { data, error } = await supabase
      .from('tables')
      .insert([{ 
        ...newTable, 
        restaurant_id: restaurant.id,
        is_available: true 
      }])
      .select();
    
    if (error) {
      toast.error('Failed to add table');
    } else {
      toast.success('Table added successfully');
      // Fetch the table with its type information
      const { data: fullTableData } = await supabase
        .from('tables')
        .select('*, table_types(*)')
        .eq('id', data[0].id)
        .single();
      
      setTables([...tables, fullTableData]);
      setNewTable({
        table_type_id: '',
        table_number: '',
        position_description: ''
      });
    }
  };

  const deleteTable = async (tableId) => {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', tableId);
    
    if (error) {
      toast.error('Failed to delete table');
    } else {
      toast.success('Table deleted successfully');
      setTables(tables.filter(table => table.id !== tableId));
    }
  };

  const updateBookingCost = async () => {
    const { error } = await supabase
      .from('restaurants')
      .update({ booking_cost: bookingCostInput })
      .eq('id', restaurant.id);
  
    if (error) {
      toast.error('Failed to update booking cost');
    } else {
      toast.success('Booking cost updated successfully');
      setRestaurant((prev) => ({ ...prev, booking_cost: bookingCostInput }));
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
        {restaurant && <SubscriptionManager restaurant={restaurant} />}
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Reservations</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFilterDate('');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Enhanced Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by Name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full pl-10 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-400 appearance-none"
                />
              </div>
            </div>

            {/* New Reservations Indicator */}
            {filteredReservations.some(res => res.is_new) && (
              <div className="mb-4 p-3 bg-blue-900/50 border border-blue-500 rounded-lg flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                <span className="text-blue-300">New reservations since your last visit</span>
              </div>
            )}

            {/* Reservations List */}
            <div className="space-y-4">
              {filteredReservations.length === 0 ? (
                <div className="p-6 bg-gray-700/50 rounded-xl text-center text-gray-400">
                  No reservations found {filterDate ? `on ${new Date(filterDate).toLocaleDateString()}` : ''}
                </div>
              ) : (
                <>
                  {filteredReservations.slice(0, showAllReservations ? filteredReservations.length : 5).map((res) => (
                    <motion.div
                      key={res.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className={`p-6 rounded-xl shadow-xl relative ${res.is_new ? 'border-l-4 border-blue-500 bg-gray-700' : 'bg-white text-black'}`}
                    >
                      {res.is_new && (
                        <span className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          New
                        </span>
                      )}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className={`text-xl font-bold ${res.is_new ? 'text-white' : 'text-black'}`}>
                            {res.name}
                            {res.is_new && <span className="ml-2 animate-pulse">✨</span>}
                          </h3>
                          <p><strong className={res.is_new ? 'text-blue-300' : ''}>Date:</strong> {new Date(res.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          <p><strong className={res.is_new ? 'text-blue-300' : ''}>Time:</strong> {res.time}</p>
                          <p><strong className={res.is_new ? 'text-blue-300' : ''}>Guests:</strong> {res.people}</p>
                          {res.table_number && (
                            <p><strong className={res.is_new ? 'text-blue-300' : ''}>Table:</strong> {res.table_number}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => markAsSeen(res.id)}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm transition-all"
                          >
                            Mark Seen
                          </button>
                          <button
                            onClick={() => cancelReservation(res.id)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      
                      {res.special_request && (
                        <div className="mt-3 pt-3 border-t border-gray-600">
                          <p><strong className={res.is_new ? 'text-blue-300' : ''}>Special Request:</strong> {res.special_request}</p>
                        </div>
                      )}
                      {res.occassion && (
                        <p><strong className={res.is_new ? 'text-blue-300' : ''}>Occasion:</strong> {res.occassion}</p>
                      )}
                    </motion.div>
                  ))}

                  {filteredReservations.length > 5 && (
                    <button
                      onClick={() => setShowAllReservations(!showAllReservations)}
                      className="mt-4 w-full bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-3 rounded-lg hover:opacity-80 transition-all font-semibold"
                    >
                      {showAllReservations ? 'Show Less' : `Show All (${filteredReservations.length})`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="mb-6 p-6 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
            <h2 className="text-2xl font-semibold mb-6 text-yellow-400">Manage Restaurant</h2>
            <div className="space-y-8">
              {/* Update Restaurant Image Section */}
              <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-yellow-400">Update Restaurant Image</h3>
                  <div className="group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute hidden group-hover:block bottom-full mb-2 w-64 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg">
                      Upload a new image for your restaurant. This will be displayed to customers when they browse your restaurant.
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <img
                    src={restaurant?.image || '/images/lounge.jpeg'}
                    alt="Restaurant"
                    className="w-32 h-32 rounded-lg object-cover shadow-md"
                  />
                  <div className="flex flex-col gap-4 w-full sm:w-auto">
                    <input
                      type="file"
                      onChange={handleImageChange}
                      className="w-full p-2 bg-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                    />
                    {newImage && (
                      <button
                        onClick={updateRestaurantImage}
                        className="bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-2 rounded-lg hover:opacity-80 transition-all text-white font-semibold"
                      >
                        Update Image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Manage Table Types Section */}
              <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-yellow-400">Manage Table Types</h3>
                  <div className="group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute hidden group-hover:block bottom-full mb-2 w-64 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg">
                      Define different types of tables in your restaurant (e.g., 2-seater, 4-seater, VIP booth)
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Add New Table Type Form */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-300">Add New Table Type</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Type name (e.g., 2-seater)"
                        value={newTableType.name}
                        onChange={(e) => setNewTableType({...newTableType, name: e.target.value})}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                      />
                      <input
                        type="number"
                        placeholder="Capacity"
                        min="1"
                        value={newTableType.capacity}
                        onChange={(e) => setNewTableType({...newTableType, capacity: parseInt(e.target.value)})}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                      />
                      <textarea
                        placeholder="Description (optional)"
                        value={newTableType.description}
                        onChange={(e) => setNewTableType({...newTableType, description: e.target.value})}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                        rows="2"
                      />
                      <button
                        onClick={addTableType}
                        className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded hover:opacity-90 transition-all text-white font-medium"
                      >
                        Add Table Type
                      </button>
                    </div>
                  </div>

                  {/* Existing Table Types List */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-300">Existing Table Types</h4>
                    {tableTypes.length === 0 ? (
                      <p className="text-gray-400">No table types defined yet</p>
                    ) : (
                      <div className="space-y-2">
                        {tableTypes.map(type => (
                          <div key={type.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
                            <div>
                              <span className="font-medium">{type.name}</span> 
                              <span className="text-sm text-gray-400 ml-2">(Capacity: {type.capacity})</span>
                              {type.description && (
                                <p className="text-xs text-gray-400 mt-1">{type.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => deleteTableType(type.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Manage Tables Section */}
              <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-yellow-400">Manage Tables</h3>
                  <div className="group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute hidden group-hover:block bottom-full mb-2 w-64 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg">
                      Add and manage individual tables in your restaurant. Assign them to table types.
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Add New Table Form */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-300">Add New Table</h4>
                    <div className="space-y-3">
                      <select
                        value={newTable.table_type_id}
                        onChange={(e) => setNewTable({...newTable, table_type_id: e.target.value})}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                      >
                        <option value="">Select table type</option>
                        {tableTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name} ({type.capacity} seats)
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Table number/identifier"
                        value={newTable.table_number}
                        onChange={(e) => setNewTable({...newTable, table_number: e.target.value})}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Position description (optional)"
                        value={newTable.position_description}
                        onChange={(e) => setNewTable({...newTable, position_description: e.target.value})}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                      />
                      <button
                        onClick={addTable}
                        className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded hover:opacity-90 transition-all text-white font-medium"
                      >
                        Add Table
                      </button>
                    </div>
                  </div>

                  {/* Existing Tables List */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-300">Existing Tables</h4>
                    {tables.length === 0 ? (
                      <p className="text-gray-400">No tables added yet</p>
                    ) : (
                      <div className="space-y-2">
                        {tables.map(table => (
                          <div key={table.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
                            <div>
                              <span className="font-medium">{table.table_number}</span> 
                              <span className="text-sm text-gray-400 ml-2">
                                ({table.table_types.name}, {table.table_types.capacity} seats)
                              </span>
                              {table.position_description && (
                                <p className="text-xs text-gray-400 mt-1">{table.position_description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => deleteTable(table.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Set Booking Cost Section */}
              <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-yellow-400">Set Booking Cost</h3>
                  <div className="group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute hidden group-hover:block bottom-full mb-2 w-64 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg">
                      Set the cost per booking in GHS. This is the amount customers will pay when they reserve a table at your restaurant.
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="number"
                    value={bookingCostInput}
                    onChange={(e) => setBookingCostInput(Number(e.target.value))}
                    className="p-2 bg-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 w-full sm:w-32"
                    placeholder="Enter amount in GHS"
                  />
                  <button
                    onClick={updateBookingCost}
                    className="bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-2 rounded-lg hover:opacity-80 transition-all text-white font-semibold"
                  >
                    Update Cost
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;