'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import Header from '../components/structure/header';
import ReservationCard from '../components/structure/ReservationCard';
import EmailMarketing from '../components/structure/EmailMarketing';
import SubscriptionManager from '../components/structure/hooks/SubscriptionManager';
import LuxuryAnalyticsDashboard from '../components/Dashboard/Analytics';
import CustomerSpendAnalytics from '../components/Dashboard/CustomerSpendAnalytics';
import CopyArea from '../components/structure/CopyArea';
import ClosureDaysManager from '../components/structure/ClosureDaysManager';
import ReservationTimingManager from '../components/Dashboard/ReservationTimingManager';

const ProfilePage = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllReservations, setShowAllReservations] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingCostInput, setBookingCostInput] = useState(0);
  const [lastVisit, setLastVisit] = useState(null);
  const [activeReservationTab, setActiveReservationTab] = useState('current');
  const [bookingCostTiers, setBookingCostTiers] = useState([]);
  const [newCostTier, setNewCostTier] = useState({
    min_people: 1,
    max_people: 1,
    cost: 0
  });
  
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
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'customers', 'insights', 'reservations', 'manage'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
    const currentReservation = reservations.find(res => res.id === reservationId);
    const newSeenStatus = !currentReservation?.seen;
  
    const { error } = await supabase
      .from('reservations')
      .update({ seen: newSeenStatus })
      .eq('id', reservationId);
    
    if (!error) {
      setReservations(reservations.map(res => 
        res.id === reservationId ? { ...res, seen: newSeenStatus } : res
      ));
      toast.success(newSeenStatus ? 'Reservation marked as seen' : 'Reservation unmarked');
    } else {
      toast.error('Failed to update reservation status');
    }
  };

  const markAsAttended = async (reservationId) => {
    try {
      // Find the current reservation
      const currentReservation = reservations.find(res => res.id === reservationId);
      
      // Check if the reservation exists
      if (!currentReservation) {
        console.error('Reservation not found for ID:', reservationId);
        toast.error('Reservation not found');
        return;
      }

      const newAttendedStatus = !currentReservation.attended;

      // Perform the Supabase update
      const { error } = await supabase
        .from('reservations')
        .update({ attended: newAttendedStatus })
        .eq('id', reservationId);

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(error.message || 'Failed to update attendance status in Supabase');
      }

      // Update local state
      setReservations(reservations.map(res =>
        res.id === reservationId ? { ...res, attended: newAttendedStatus } : res
      ));
      toast.success(newAttendedStatus ? 'Marked as attended' : 'Unmarked as attended');
    } catch (error) {
      console.error('Error in markAsAttended:', error);
      toast.error(error.message || 'Failed to update attendance status');
      throw error; 
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

    try {
      // Check if table_number is a number (for multiple tables)
      const tableCount = parseInt(newTable.table_number);
      const isMultipleTables = !isNaN(tableCount) && tableCount > 1;

      if (isMultipleTables) {
        // Create multiple tables
        const tablesToInsert = Array.from({ length: tableCount }, (_, i) => ({
          table_type_id: newTable.table_type_id,
          table_number: (i + 1).toString(), // Number them sequentially
          position_description: newTable.position_description,
          restaurant_id: restaurant.id,
          is_available: true
        }));

        const { data, error } = await supabase
          .from('tables')
          .insert(tablesToInsert)
          .select();

        if (error) throw error;

        // Fetch all the newly created tables with their types
        const { data: fullTablesData } = await supabase
          .from('tables')
          .select('*, table_types(*)')
          .in('id', data.map(t => t.id));

        setTables([...tables, ...fullTablesData]);
        toast.success(`Created ${tableCount} tables successfully`);
      } else {
        // Single table creation (original logic)
        const { data, error } = await supabase
          .from('tables')
          .insert([{ 
            ...newTable, 
            restaurant_id: restaurant.id,
            is_available: true 
          }])
          .select();
        
        if (error) throw error;

        const { data: fullTableData } = await supabase
          .from('tables')
          .select('*, table_types(*)')
          .eq('id', data[0].id)
          .single();
        
        setTables([...tables, fullTableData]);
        toast.success('Table added successfully');
      }

      // Reset form
      setNewTable({
        table_type_id: '',
        table_number: '',
        position_description: ''
      });

    } catch (error) {
      console.error('Error adding table(s):', error);
      toast.error(error.message || 'Failed to add table(s)');
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

  useEffect(() => {
    const fetchBookingCostTiers = async () => {
      if (!restaurant) return;
      
      const { data, error } = await supabase
        .from('booking_cost_tiers')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('min_people', { ascending: true });
      
      if (!error) setBookingCostTiers(data);
    };
    
    if (restaurant) fetchBookingCostTiers();
  }, [restaurant]);

  const addBookingCostTier = async () => {
    if (!restaurant) {
      toast.error('Restaurant information not loaded yet');
      return;
    }

    if (!newCostTier.min_people || !newCostTier.max_people || !newCostTier.cost) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate that min_people <= max_people
    if (newCostTier.min_people > newCostTier.max_people) {
      toast.error('Minimum people cannot be greater than maximum people');
      return;
    }

    // Check for overlapping ranges
    const hasOverlap = bookingCostTiers.some(tier => 
      (newCostTier.min_people <= tier.max_people && newCostTier.max_people >= tier.min_people)
    );

    if (hasOverlap) {
      toast.error('This range overlaps with an existing tier');
      return;
    }

    const { data, error } = await supabase
      .from('booking_cost_tiers')
      .insert([{ 
        ...newCostTier, 
        restaurant_id: restaurant.id 
      }])
      .select();
    
    if (error) {
      toast.error('Failed to add booking cost tier');
    } else {
      toast.success('Booking cost tier added successfully');
      setBookingCostTiers([...bookingCostTiers, data[0]]);
      setNewCostTier({ min_people: 1, max_people: 1, cost: 0 });
    }
  };

  const deleteBookingCostTier = async (tierId) => {
    const { error } = await supabase
      .from('booking_cost_tiers')
      .delete()
      .eq('id', tierId);
    
    if (error) {
      toast.error('Failed to delete booking cost tier');
    } else {
      toast.success('Booking cost tier deleted successfully');
      setBookingCostTiers(bookingCostTiers.filter(tier => tier.id !== tierId));
    }
  };

  const updateBookingCost = async () => {
    try {
      if (!restaurant?.id) {
        toast.error('Restaurant information not loaded yet');
        return;
      }

      if (bookingCostTiers.length === 0) {
        const cost = bookingCostInput === '' || bookingCostInput === null ? null : Math.floor(Number(bookingCostInput));
        
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
        
        setRestaurant(prev => ({ ...prev, booking_cost: data.booking_cost }));
        setBookingCostInput(data.booking_cost === null ? '' : data.booking_cost);

        toast.success(
          data.booking_cost === null 
            ? 'Booking cost cleared' 
            : `Booking cost set to GHS ${data.booking_cost}`
        );
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update booking cost');
    }
  };

  const cancelReservation = async (id) => {
    try {
      console.log('Starting cancellation process for reservation:', id);
      
      // First get the reservation details before cancelling
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select(`
          *,
          restaurants (
            name,
            phone,
            owner:owner_id (
              email,
              name
            )
          ),
          users (
            name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching reservation:', fetchError);
        throw fetchError;
      }

      console.log('Fetched reservation data:', reservation);

      // Now cancel the reservation
      const { error } = await supabase
        .from('reservations')
        .update({ cancelled: true })
        .eq('id', id);
      
      if (error) {
        console.error('Error cancelling reservation:', error);
        throw error;
      }

      // Prepare email data
      const emailData = {
        reservation: {
          ...reservation,
          user_name: reservation.name,
          user_email: reservation.email,
          restaurant_name: reservation.restaurants?.name,
          restaurant_email: reservation.restaurants?.owner?.email,
          restaurant_phone: reservation.restaurants?.phone,
          restaurant_address: reservation.restaurants?.address
        }
      };

      console.log('Prepared email data:', emailData);

      // Send cancellation email
      try {
        console.log('Attempting to send cancellation email...');
        const response = await fetch('/api/send-cancellation-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        if (!response.ok) {
          const errorResponse = await response.json();
          console.error('Failed to send cancellation email. Status:', response.status, 'Response:', errorResponse);
          throw new Error(`Email API responded with status ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Email sent successfully:', responseData);
      } catch (emailError) {
        console.error('Error in email sending process:', emailError);
        throw emailError;
      }

      // Update local state
      setReservations(reservations.map(res => 
        res.id === id ? { ...res, cancelled: true } : res
      ));
      toast.success('Reservation cancelled and email sent');
    } catch (error) {
      console.error('Complete cancellation error:', error);
      toast.error(error.message || 'Failed to cancel reservation');
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
          {['overview', 'customers', 'insights', 'reservations', 'manage'].map((tab) => (
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
            <LuxuryAnalyticsDashboard restaurant={restaurant} reservations={reservations}/>
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

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="mb-6 p-6 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
            <h2 className="text-2xl font-semibold mb-6 text-gray-100">Customer Spend Analytics</h2>
            <CustomerSpendAnalytics restaurant={restaurant} reservations={reservations} />
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
                        markAsAttended={markAsAttended}
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
                              markAsAttended={markAsAttended}
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
                        markAsAttended={markAsAttended}
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
                    src={restaurant?.restaurant_image || '/images/placeholder.jpg'}
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
                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
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
                        placeholder="Number of tables to create (e.g. '5') or specific name (e.g. 'Window Table 1')"
                        value={newTable.table_number}
                        onChange={(e) => setNewTable({...newTable, table_number: e.target.value})}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Enter a number to create multiple tables of this type, or a specific name for a single table.
                      </p>
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
                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
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

              <ClosureDaysManager restaurant={restaurant} />
              <ReservationTimingManager restaurant={restaurant} setRestaurant={setRestaurant} />

              {/* Set Booking Cost Section */}
              <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-yellow-400">Booking Pricing</h3>
                </div>
                
                {/* Single Booking Cost Option */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-gray-300">Single Booking Cost</h4>
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <input
                      type="number"
                      value={bookingCostInput === null ? '' : bookingCostInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBookingCostInput(value === '' ? null : Math.floor(Number(value)));
                      }}
                      min="0"
                      step="1"
                      className="p-2 bg-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 w-full sm:w-32"
                      placeholder={restaurant?.booking_cost === null ? "Not set" : "GHS"}
                      disabled={bookingCostTiers.length > 0}
                    />
                    
                    <button
                      onClick={updateBookingCost}
                      className="bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-2 rounded-lg hover:opacity-80 transition-all text-white font-semibold"
                      disabled={bookingCostTiers.length > 0}
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
                        disabled={bookingCostTiers.length > 0}
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

                {/* Tiered Pricing Option */}
                <div>
                  <h4 className="font-semibold mb-3 text-gray-300">Tiered Pricing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Add New Tier Form */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-semibold mb-3 text-gray-300">Add New Pricing Tier</h5>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Min people"
                            min="1"
                            value={newCostTier.min_people}
                            onChange={(e) => setNewCostTier({...newCostTier, min_people: parseInt(e.target.value)})}
                            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                          />
                          <input
                            type="number"
                            placeholder="Max people"
                            min="1"
                            value={newCostTier.max_people}
                            onChange={(e) => setNewCostTier({...newCostTier, max_people: parseInt(e.target.value)})}
                            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                          />
                        </div>
                        <input
                          type="number"
                          placeholder="Cost (GHS)"
                          min="0"
                          value={newCostTier.cost}
                          onChange={(e) => setNewCostTier({...newCostTier, cost: parseInt(e.target.value)})}
                          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                        />
                        <button
                          onClick={addBookingCostTier}
                          className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded hover:opacity-90 transition-all text-white font-medium"
                        >
                          Add Pricing Tier
                        </button>
                      </div>
                    </div>

                    {/* Existing Tiers List */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-semibold mb-3 text-gray-300">Current Pricing Tiers</h5>
                      {bookingCostTiers.length === 0 ? (
                        <p className="text-gray-400">No pricing tiers defined</p>
                      ) : (
                        <div className="space-y-2">
                          {bookingCostTiers.map(tier => (
                            <div key={tier.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
                              <div>
                                <span className="font-medium">{tier.min_people}-{tier.max_people} people</span> 
                                <span className="text-sm text-gray-400 ml-2">(GHS {tier.cost})</span>
                              </div>
                              <button
                                onClick={() => deleteBookingCostTier(tier.id)}
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
                  <p className="text-gray-400 text-xs mt-3">
                    When tiered pricing is set, it will override the single booking cost.
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

export default function ProfilePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePage />
    </Suspense>
  );
}