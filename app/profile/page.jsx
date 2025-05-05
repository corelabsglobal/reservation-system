'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import Header from '../components/structure/header';
import ReservationCard from '../components/structure/ReservationCard';
import EmailMarketing from '../components/structure/EmailMarketing';
import SubscriptionManager from '../components/structure/hooks/SubscriptionManager';
import CopyArea from '../components/structure/CopyArea';
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
  const [activeReservationTab, setActiveReservationTab] = useState('current');
  
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
    if (!restaurant) {
      toast.error('Restaurant information not loaded yet');
      return;
    }

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
    try {
      const { count: reservationCount, error: reservationError } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('table_id', tableId);
  
      if (reservationError) throw reservationError;
  
      if (reservationCount > 0) {
        toast.error('Cannot delete table - It has existing reservations');
        return;
      }
  
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);
      
      if (error) throw error;
  
      toast.success('Table deleted successfully');
      setTables(tables.filter(table => table.id !== tableId));
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    }
  };

  const updateBookingCost = async () => {
    try {
      if (!restaurant?.id) {
        toast.error('Restaurant information not loaded yet');
        return;
      }
  
      const cost = bookingCostInput === '' || bookingCostInput === null ? null : Math.floor(Number(bookingCostInput));
      
      // Validate input
      if (cost !== null && (isNaN(cost) || cost < 0)) {
        toast.error('Please enter a valid positive number');
        return;
      }
  
      const { error } = await supabase
        .from('restaurants')
        .update({ booking_cost: cost })
        .eq('id', restaurant.id);
  
      if (error) throw error;
  
      const { data } = await supabase
        .from('restaurants')
        .select('booking_cost')
        .eq('id', restaurant.id)
        .single();
  
      if (!data) throw new Error('Failed to verify update');
      
      // Update local state
      setRestaurant(prev => ({ ...prev, booking_cost: data.booking_cost }));
      setBookingCostInput(data.booking_cost === null ? '' : data.booking_cost);
  
      toast.success(
        data.booking_cost === null 
          ? 'Booking cost cleared' 
          : `Booking cost set to GHS ${data.booking_cost}`
      );
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update booking cost');
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
        .update({ restaurant_image: newImage })
        .eq('id', restaurant.id);
  
      if (error) {
        toast.error('Failed to update image in Supabase');
      } else {
        toast.success('Image updated successfully');
        setRestaurant({ ...restaurant, restaurant_image: newImage });
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

  const currentReservations = useMemo(() => {
    return filteredReservations.filter(res => {
      const reservationTime = new Date(`${res.date}T${res.time}`);
      const now = new Date();
      const fifteenMinutesBefore = new Date(now.getTime() + 15 * 60000);
      return reservationTime <= fifteenMinutesBefore && 
             reservationTime >= new Date(now.getTime() - 2 * 3600000);
    });
  }, [filteredReservations]);
  
  // Filter reservations for today
  const todaysReservations = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return filteredReservations.filter(res => res.date === today);
  }, [filteredReservations]);

  const generateCustomerPDF = () => {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(`${restaurant?.name || 'Restaurant'} Customer Report`, 15, 15);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 25);
    
    // Add summary statistics
    doc.setFontSize(14);
    doc.text('Summary Statistics', 15, 35);
    
    const uniqueCustomers = Array.from(new Set(reservations.map(res => res.email))).length;
    const repeatCustomers = Object.values(reservations.reduce((acc, res) => {
      acc[res.email] = (acc[res.email] || 0) + 1;
      return acc;
    }, {})).filter(count => count > 1).length;
    const newThisMonth = Array.from(new Set(reservations
      .filter(res => new Date(res.date) > new Date(new Date().setDate(new Date().getDate() - 30)))
      .map(res => res.email)
    )).length;
    
    doc.setFontSize(12);
    doc.text(`Total Unique Customers: ${uniqueCustomers}`, 15, 45);
    doc.text(`Repeat Customers: ${repeatCustomers}`, 15, 55);
    doc.text(`New Customers This Month: ${newThisMonth}`, 15, 65);
    
    // Add customer table header
    doc.setFontSize(14);
    doc.text('Customer Details', 15, 80);
    
    const customerData = Object.entries(
      reservations.reduce((acc, res) => {
        if (!acc[res.email]) {
          acc[res.email] = {
            name: res.name,
            email: res.email,
            phone: res.number ? `0${res.number}` : 'N/A',
            reservationCount: 0,
            lastVisit: '',
            reservations: []
          };
        }
        acc[res.email].reservationCount++;
        acc[res.email].reservations.push(res);
        return acc;
      }, {})
    )
    .sort(([,a], [,b]) => b.reservationCount - a.reservationCount);
    
    // Add table headers
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Name', 15, 90);
    doc.text('Email', 60, 90);
    doc.text('Phone', 110, 90);
    doc.text('Visits', 150, 90);
    doc.text('Last Visit', 180, 90);
    doc.setFont(undefined, 'normal');
    
    // Add customer rows
    let yPosition = 100;
    customerData.forEach(([email, customer], index) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      
      const lastReservation = customer.reservations
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
      doc.text(customer.name, 15, yPosition);
      doc.text(customer.email, 60, yPosition);
      doc.text(customer.phone, 110, yPosition);
      doc.text(customer.reservationCount.toString(), 150, yPosition);
      
      if (lastReservation) {
        doc.text(
          `${new Date(lastReservation.date).toLocaleDateString()} ${lastReservation.time}`,
          180,
          yPosition
        );
      }
      
      yPosition += 10;
    });
    
    doc.save(`${restaurant?.name || 'restaurant'}_customers_${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
            <h2 className="text-2xl font-semibold mb-6 text-gray-100">Reservation Overview</h2>
            {restaurant?.url && (
              <CopyArea restaurantUrl={restaurant?.url}/>
            )}

            {/* Circle Charts Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Chart 1: Reservation Status Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="p-6 bg-gray-700/50 rounded-xl shadow-lg"
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-200">Reservation Status</h3>
                <ResponsiveContainer width="100%" height={220}>
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
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {[
                        { name: 'Confirmed', fill: '#4ADE80' },
                        { name: 'Pending', fill: '#FBBF24' },
                        { name: 'Canceled', fill: '#EF4444' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151', 
                        borderRadius: '6px',
                        color: '#F3F4F6'
                      }}
                      formatter={(value, name, props) => [`${value}%`, name]}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ 
                        fontSize: '12px', 
                        color: '#E5E7EB',
                        marginTop: '10px'
                      }}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
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
                <h3 className="text-lg font-semibold mb-4 text-gray-200">Customer Type</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'New Customers', value: 60, fill: '#60A5FA' },
                        { name: 'Returning Customers', value: 40, fill: '#A78BFA' },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {[
                        { name: 'New Customers', fill: '#60A5FA' },
                        { name: 'Returning Customers', fill: '#A78BFA' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151', 
                        borderRadius: '6px',
                        color: '#F3F4F6'
                      }}
                      formatter={(value, name, props) => [`${value}%`, name]}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ 
                        fontSize: '12px', 
                        color: '#E5E7EB',
                        marginTop: '10px'
                      }}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
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
                <h3 className="text-lg font-semibold mb-4 text-gray-200">Peak Times</h3>
                <ResponsiveContainer width="100%" height={220}>
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
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {[
                        { name: 'Morning', fill: '#F472B6' },
                        { name: 'Afternoon', fill: '#FB923C' },
                        { name: 'Evening', fill: '#818CF8' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151', 
                        borderRadius: '6px',
                        color: '#F3F4F6'
                      }}
                      formatter={(value, name, props) => [`${value}%`, name]}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ 
                        fontSize: '12px', 
                        color: '#E5E7EB',
                        marginTop: '10px'
                      }}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
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
              className="w-full h-72 sm:h-80 bg-gray-700/50 rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-200">Monthly Reservations</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart 
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#CBD5E0" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#CBD5E0" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151', 
                      borderRadius: '6px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{
                      fontSize: '12px',
                      color: '#E5E7EB',
                      paddingTop: '10px'
                    }}
                  />
                  <Bar
                    dataKey="reservations"
                    name="Total Reservations"
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Customers</h2>
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-400 text-sm">
                  Unique: {Array.from(new Set(reservations.map(res => res.email))).length}
                </div>
                <div className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-sm">
                  Total: {reservations.length}
                </div>
                <div className="bg-white-500/20 px-3 py-1 rounded-full text-yellow-400 text-sm flex items-center gap-1">
                  <button 
                    onClick={generateCustomerPDF}
                    className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    title="Download customer report"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Contact</th>
                    <th className="px-4 py-3 text-left">Reservations</th>
                    <th className="px-4 py-3 text-left">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    reservations.reduce((acc, res) => {
                      if (!acc[res.email]) {
                        acc[res.email] = {
                          name: res.name,
                          email: res.email,
                          phone: res.number ? `0${res.number}` : 'N/A',
                          reservationCount: 0,
                          lastVisit: '',
                          reservations: []
                        };
                      }
                      acc[res.email].reservationCount++;
                      acc[res.email].reservations.push(res);
                      return acc;
                    }, {})
                  )
                  .sort(([,a], [,b]) => b.reservationCount - a.reservationCount)
                  .map(([email, customer]) => {
                    const lastReservation = customer.reservations
                      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                    
                    return (
                      <tr key={email} className="border-b border-gray-700 hover:bg-gray-700/50 transition-all">
                        <td className="px-4 py-3">
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-gray-400">{customer.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{customer.phone}</div>
                          {customer.reservationCount > 1 && (
                            <div className="text-xs text-green-400">
                              {customer.reservationCount} visits
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lastReservation && (
                            <>
                              <div>{new Date(lastReservation.date).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-400">{lastReservation.time}</div>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {customer.reservationCount > 1 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                                Regular
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                              New
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Customer Stats Summary */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Total Customers</div>
                <div className="text-2xl font-bold">
                  {Array.from(new Set(reservations.map(res => res.email))).length}
                </div>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Repeat Customers</div>
                <div className="text-2xl font-bold">
                  {Object.values(reservations.reduce((acc, res) => {
                    acc[res.email] = (acc[res.email] || 0) + 1;
                    return acc;
                  }, {})).filter(count => count > 1).length}
                </div>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">New This Month</div>
                <div className="text-2xl font-bold">
                  {Array.from(new Set(reservations
                    .filter(res => new Date(res.date) > new Date(new Date().setDate(new Date().getDate() - 30)))
                    .map(res => res.email)
                  )).length}
                </div>
              </div>
            </div>
            <EmailMarketing restaurantId={restaurant?.id} name={restaurant?.name} />
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="mb-6 p-6 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
            <div className="flex justify-between items-center mb-6">
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

            {/* Reservation Group Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700 pb-4">
              {['current', 'today', 'all'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveReservationTab(tab)}
                  className={`px-4 py-2 rounded-lg capitalize text-sm sm:text-base transition-all ${
                    activeReservationTab === tab 
                      ? 'bg-gradient-to-r from-yellow-400 to-pink-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {tab === 'current' ? 'Current' : tab === 'today' ? "Today's" : 'All'} Reservations
                  {tab === 'current' && currentReservations.length > 0 && (
                    <span className="ml-2 bg-white text-black rounded-full px-2 py-0.5 text-xs">
                      {currentReservations.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Enhanced Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by Name, Table, or Notes"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-400"
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

            {/* Current Reservations Section */}
            {activeReservationTab === 'current' && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  Current Reservations
                  <span className="text-sm bg-green-900/50 text-green-400 px-2 py-1 rounded-full ml-2">
                    {currentReservations.length} active
                  </span>
                </h3>
                
                {currentReservations.length === 0 ? (
                  <div className="p-6 bg-gray-700/50 rounded-xl text-center text-gray-400">
                    No current reservations at this time
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentReservations.map((res) => (
                      <ReservationCard 
                        key={res.id} 
                        res={res} 
                        markAsSeen={markAsSeen}
                        cancelReservation={cancelReservation}
                        highlightCurrent
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Today's Reservations Section */}
            {activeReservationTab === 'today' && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Today's Reservations
                  <span className="text-sm bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded-full ml-2">
                    {todaysReservations.length} total
                  </span>
                </h3>
                
                {todaysReservations.length === 0 ? (
                  <div className="p-6 bg-gray-700/50 rounded-xl text-center text-gray-400">
                    No reservations for today
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Timeline View for Today's Reservations */}
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-600"></div>
                      
                      {todaysReservations.map((res, index) => {
                        const reservationTime = new Date(`${res.date}T${res.time}`);
                        const isPast = reservationTime < new Date();
                        
                        return (
                          <div key={res.id} className="relative pl-10 pb-4">
                            {/* Timeline dot */}
                            <div className={`absolute left-4 top-4 w-3 h-3 rounded-full ${isPast ? 'bg-gray-500' : 'bg-yellow-400'} transform -translate-x-1/2 z-10`}></div>
                            
                            <ReservationCard 
                              res={res} 
                              markAsSeen={markAsSeen}
                              cancelReservation={cancelReservation}
                              isPast={isPast}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* All Reservations Section */}
            {activeReservationTab === 'all' && (
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  All Reservations
                  <span className="text-sm bg-blue-900/50 text-blue-400 px-2 py-1 rounded-full ml-2">
                    {filteredReservations.length} total
                  </span>
                </h3>

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
                {filteredReservations.length === 0 ? (
                  <div className="p-6 bg-gray-700/50 rounded-xl text-center text-gray-400">
                    No reservations found {filterDate ? `on ${new Date(filterDate).toLocaleDateString()}` : ''}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReservations.slice(0, showAllReservations ? filteredReservations.length : 10).map((res) => (
                      <ReservationCard 
                        key={res.id} 
                        res={res} 
                        markAsSeen={markAsSeen}
                        cancelReservation={cancelReservation}
                      />
                    ))}

                    {filteredReservations.length > 10 && (
                      <button
                        onClick={() => setShowAllReservations(!showAllReservations)}
                        className="mt-4 w-full bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-3 rounded-lg hover:opacity-80 transition-all font-semibold"
                      >
                        {showAllReservations ? 'Show Less' : `Show All (${filteredReservations.length})`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
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
                    src={restaurant?.restaurant_image || '/images/lounge.jpeg'}
                    alt="Restaurant"
                    className="w-32 h-32 rounded-lg object-cover shadow-md"
                  />
                  <div className="flex flex-col gap-4 w-full sm:w-auto">
                    <input
                      type="file"
                      onChange={handleImageChange}
                      accept="image/*"
                      className="w-full p-2 bg-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                    />
                    {newImage && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-300">New preview:</span>
                          <img 
                            src={newImage} 
                            alt="New preview" 
                            className="w-12 h-12 rounded object-cover"
                          />
                        </div>
                        <button
                          onClick={updateRestaurantImage}
                          className="bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-2 rounded-lg hover:opacity-80 transition-all text-white font-semibold"
                        >
                          Confirm Update
                        </button>
                      </>
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
                        placeholder="Number of Tables"
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
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <input
                    type="number"
                    value={bookingCostInput === null ? '' : bookingCostInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string (will set to null) or valid numbers
                      setBookingCostInput(value === '' ? null : Math.floor(Number(value)));
                    }}
                    min="0"
                    step="1"
                    className="p-2 bg-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 w-full sm:w-32"
                    placeholder={restaurant?.booking_cost === null ? "Not set" : "GHS"}
                  />
                  
                  <button
                    onClick={updateBookingCost}
                    className="bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-2 rounded-lg hover:opacity-80 transition-all text-white font-semibold"
                  >
                    {restaurant?.booking_cost === null ? "Set Cost" : "Update"}
                  </button>
                  
                  {restaurant?.booking_cost !== null && (
                    <button
                      onClick={() => {
                        setBookingCostInput(null);
                        updateBookingCost();
                      }}
                      className="bg-gray-500 px-3 py-2 rounded-lg hover:bg-gray-600 transition-all text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="mt-3 text-sm">
                  <p className="text-gray-300">
                    Current Booking Cost: {restaurant?.booking_cost === null ? (
                      <span className="text-yellow-300">NULL</span>
                    ) : (
                      <span className="text-green-400">GHS {restaurant?.booking_cost}</span>
                    )}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {restaurant?.booking_cost === null ? "No booking fee will be charged" : "This amount will be charged per booking"}
                  </p>
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