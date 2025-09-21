'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";
import emailjs from '@emailjs/browser';
import { generateTimeSlots } from "@/utils/timeSlots";
import DateSelector from "@/app/components/restaurants/DateSelector";
import PartySizeSelector from "@/app/components/restaurants/PartySizeSelector";
import TimeSlotsGrid from "@/app/components/restaurants/TimeSlotsGrid";
import BookingDialog from "@/app/components/restaurants/BookingDialog";
import PaymentModal from "@/app/components/restaurants/PaymentModal";
import ReservationNotification from "@/app/components/restaurants/ReservationNotification";
import PhotoGallery from "@/app/components/restaurants/PhotoGallery";
import LoadingAnimation from "@/components/ui/LoadingAnimation";
import HeroCarousel from "@/app/components/restaurants/HeroCarousel";
import NotFound from "@/components/ui/NotFound";
import Reviews from "@/app/components/restaurants/Reviews";
import dynamic from 'next/dynamic';
import RestaurantHeader from "@/app/components/restaurants/Header";

const MapWithNoSSR = dynamic(
  () => import('../../components/restaurants/Map'),
  { ssr: false }
);

export default function RestaurantPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [userId, setUserId] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [showPaystack, setShowPaystack] = useState(false);
  const [bookingCost, setBookingCost] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [partySize, setPartySize] = useState(2);
  const [tableTypes, setTableTypes] = useState([]);
  const [allTables, setAllTables] = useState([]);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookingCostTiers, setBookingCostTiers] = useState([]);
  const [notification, setNotification] = useState(null);
  const [closureDays, setClosureDays] = useState([]);
  const [activeTab, setActiveTab] = useState('reserve');
  const [showLoading, setShowLoading] = useState(true);
  
  const isDateClosed = (date) => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    return closureDays.some(closure => {
      if (!closure.is_recurring && closure.date === date) {
        return true;
      }
      if (closure.is_recurring && closure.day_of_week === dayOfWeek) {
        return true;
      }
      return false;
    });
  };
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const urlDate = searchParams.get('date');
    let initialDate = new Date().toISOString().split("T")[0];
    
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
      initialDate = urlDate;
    }

    if (isDateClosed(initialDate)) {
      let nextDate = new Date(initialDate);
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = nextDate.toISOString().split("T")[0];
        if (!isDateClosed(nextDateStr)) {
          return nextDateStr;
        }
        attempts++;
      }
    }
    
    return initialDate;
  });

  const timeSlots = restaurant ? generateTimeSlots(
    restaurant.reservation_start_time?.slice(0, 5) || '12:00',
    restaurant.reservation_end_time?.slice(0, 5) || '22:00',
    restaurant.reservation_duration_minutes || 120
  ) : [];

  const isTimeSlotPassed = (slot, date) => {
    if (date !== new Date().toISOString().split("T")[0]) {
      return false;
    }
    
    const now = new Date();
    const [hours, minutes] = slot.split(':').map(Number);
    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);
    
    return now > slotTime;
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: userData, error } = await supabase.auth.getUser();
        if (error || !userData?.user) {
          console.log("User not authenticated");
          return;
        }
        setUserId(userData.user.id);
      } catch (err) {
        console.error("Unexpected error fetching user:", err.message);
      }
    }
    fetchUser();
  }, []);  

  useEffect(() => {
    if (!id) return;

    const fetchRestaurantData = async () => {
      try {
        let { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", id)
          .single();

        if (restaurantError || !restaurantData) {
          ({ data: restaurantData, error: restaurantError } = await supabase
            .from("restaurants")
            .select("*")
            .eq("url", id)
            .single());
        }

        if (restaurantError || !restaurantData) {
          throw new Error("Restaurant not found");
        }

        setRestaurant(restaurantData);
        const actualRestaurantId = restaurantData.id;

        setBookingCost(getBookingCost(partySize));

        const { data: tableData, error: tableError } = await supabase
          .from("table_types")
          .select(`
            *,
            tables: tables!table_type_id (
              id,
              table_number,
              is_available,
              position_description
            )
          `)
          .eq("restaurant_id", actualRestaurantId);

        if (tableError) throw tableError;
        
        setTableTypes(tableData);
        const tables = tableData.flatMap(type => 
          type.tables.map(table => ({ ...table, table_type_id: type.id }))
        );
        setAllTables(tables);

        if (tableData.length === 0 || tables.length === 0) {
          if (!fallbackMode) {
            setFallbackMode(true);
            setNotification({
              type: 'info',
              title: 'Notice',
              message: 'This restaurant hasn\'t set up tables yet. Using basic reservation system.'
            });
          }
        }

        const { data: reservationsData, error: reservationsError } = await supabase
          .from("reservations")
          .select("time, date, user_id, table_id, people")
          .eq("restaurant_id", actualRestaurantId)
          .eq("date", selectedDate);

        if (reservationsError) throw reservationsError;
        setReservations(reservationsData);

        const bookedTables = new Set(reservationsData.map(r => r.table_id));
        const availableTablesForSlots = new Map();

        timeSlots.forEach(slot => {
          const availableTablesForSlot = tables.filter(table => 
            !bookedTables.has(table.id)
          );
          availableTablesForSlots.set(slot, availableTablesForSlot);
        });

        const tableTypeCounts = tableTypes.reduce((acc, type) => {
          acc[type.id] = {
            capacity: type.capacity,
            total: allTables.filter(t => t.table_type_id === type.id).length
          };
          return acc;
        }, {});

        const filteredSlots = timeSlots.filter(slot => {
          if (isTimeSlotPassed(slot, selectedDate)) {
            return false;
          }

          const reservationsForSlot = reservations.filter(r => r.time === slot);

          if (fallbackMode) return true;

          // Get all available tables for this slot
          const availableTablesForSlot = allTables.filter(table => 
            !reservationsForSlot.some(r => r.table_id === table.id)
          );

          // Check for exact matches first
          const hasExactMatch = availableTablesForSlot.some(table => {
            const tableType = tableTypes.find(t => t.id === table.table_type_id);
            return tableType?.capacity === partySize;
          });

          if (hasExactMatch) return true;

          // If no exact matches, check for next 1-2 larger capacities
          const largerTables = availableTablesForSlot.filter(table => {
            const tableType = tableTypes.find(t => t.id === table.table_type_id);
            return tableType?.capacity > partySize;
          });

          // Get distinct larger capacities
          const distinctLargerCapacities = [...new Set(
            largerTables.map(table => {
              const tableType = tableTypes.find(t => t.id === table.table_type_id);
              return tableType?.capacity;
            })
          )].filter(Boolean).sort((a, b) => a - b);

          // Take the next 1-2 larger capacities
          const allowedLargerCapacities = distinctLargerCapacities.slice(0, 2);

          // Check if any tables match these larger capacities
          const hasSuitableLargerTables = largerTables.some(table => {
            const tableType = tableTypes.find(t => t.id === table.table_type_id);
            return allowedLargerCapacities.includes(tableType?.capacity);
          });

          return hasSuitableLargerTables;
        });

        setAvailableSlots(filteredSlots);
      } catch (err) {
        console.error("Error fetching data:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [id, selectedDate, partySize, reservations, fallbackMode]);

  const fetchAvailableTablesForSlot = async (timeSlot) => {
    try {
      if (fallbackMode) {
        setAvailableTables([]);
        setSelectedTable(null);
        return;
      }

      const { data: reservationsForSlot, error } = await supabase
        .from("reservations")
        .select("table_id")
        .eq("restaurant_id", restaurant?.id)
        .eq("date", selectedDate)
        .eq("time", timeSlot);

      if (error) throw error;

      const bookedTableIds = new Set(reservationsForSlot.map(r => r.table_id));
      
      // First, find tables with exact capacity match
      let suitableTables = allTables.filter(table => {
        const tableType = tableTypes.find(t => t.id === table.table_type_id);
        return !bookedTableIds.has(table.id) && 
              tableType?.capacity === partySize;
      });

      // If no exact matches or we want to show larger tables regardless,
      // find tables with next higher capacities
      const largerTables = allTables.filter(table => {
        const tableType = tableTypes.find(t => t.id === table.table_type_id);
        return !bookedTableIds.has(table.id) && 
              tableType?.capacity > partySize;
      });

      // Sort larger tables by capacity ascending to get the next suitable sizes
      largerTables.sort((a, b) => {
        const aCapacity = tableTypes.find(t => t.id === a.table_type_id)?.capacity || 0;
        const bCapacity = tableTypes.find(t => t.id === b.table_type_id)?.capacity || 0;
        return aCapacity - bCapacity;
      });

      // Find the next two distinct larger capacities
      const distinctLargerCapacities = [...new Set(
        largerTables.map(table => {
          const tableType = tableTypes.find(t => t.id === table.table_type_id);
          return tableType?.capacity;
        })
      )].filter(Boolean).sort((a, b) => a - b);

      // Take the next 1-2 larger capacities
      const allowedLargerCapacities = distinctLargerCapacities.slice(0, 2);

      // Add tables that match these larger capacities
      const additionalTables = largerTables.filter(table => {
        const tableType = tableTypes.find(t => t.id === table.table_type_id);
        return allowedLargerCapacities.includes(tableType?.capacity);
      });

      // Combine exact matches with larger tables
      suitableTables = [...suitableTables, ...additionalTables];

      // Group tables by type
      const tablesByType = suitableTables.reduce((acc, table) => {
        if (!acc[table.table_type_id]) {
          const type = tableTypes.find(t => t.id === table.table_type_id);
          acc[table.table_type_id] = {
            type,
            tables: []
          };
        }
        acc[table.table_type_id].tables.push(table);
        return acc;
      }, {});

      setAvailableTables(Object.values(tablesByType));
      setSelectedTable(suitableTables[0]?.id || null);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Failed to fetch available tables");
    }
  };

  useEffect(() => {
    const fetchClosureDays = async () => {
      if (!restaurant?.id) return;
      
      const { data, error } = await supabase
        .from('restaurant_closures')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      if (!error) {
        setClosureDays(data);
      }
    };

    fetchClosureDays();
  }, [restaurant]);

  useEffect(() => {
    const findNextOpenDate = (currentDate) => {
      let nextDate = new Date(currentDate);
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = nextDate.toISOString().split("T")[0];
        if (!isDateClosed(nextDateStr)) {
          return nextDateStr;
        }
        attempts++;
      }
      return null;
    };

    // Check if initial date is closed
    if (selectedDate && isDateClosed(selectedDate)) {
      const nextOpenDate = findNextOpenDate(selectedDate);
      if (nextOpenDate) {
        setSelectedDate(nextOpenDate);
        setNotification({
          type: 'warning',
          title: 'Restaurant Closed',
          message: `Restaurant is closed on ${selectedDate}. Showing next available date: ${nextOpenDate}.`
        });
      } else {
        setNotification({
          type: 'error',
          title: 'No Available Dates',
          message: 'Could not find an available date in the next 30 days.'
        });
      }
    }
  }, [closureDays]);

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

  const getBookingCost = (people) => {
    if (bookingCostTiers.length === 0) {
      return restaurant?.booking_cost || 0;
    }

    const matchingTier = bookingCostTiers.find(tier => 
      people >= tier.min_people && people <= tier.max_people
    );

    return matchingTier?.cost || 0;
  };

  const paystackConfig = {
    reference: new Date().getTime().toString(),
    email: email || "kbtechnologies2@gmail.com",
    amount: bookingCost * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    currency: "GHS",
    metadata: {
      restaurant_id: restaurant?.id,
      user_id: userId,
    },
  };
  
  const onPaystackSuccess = async (response) => {
    setPaymentSuccess(true);
    setNotification({
      type: 'success',
      title: 'Payment Successful',
      message: 'Proceeding with reservation...'
    });
    await saveReservation();
    setPaymentInitialized(false);
  };
  
  const onPaystackClose = () => {
    setNotification({
      type: 'error',
      title: 'Payment Failed',
      message: 'Payment canceled or failed. Please try again.'
    });
    setShowPaystack(false);
    setPaymentInitialized(false);
    setOpenDialog(true);
  };

  const handleOpenDialog = async (slot) => {
    setSelectedSlot(slot);
    await fetchAvailableTablesForSlot(slot);
    setOpenDialog(true);
  };

  const [occasionDetails, setOccasionDetails] = useState({
    occasion: "",
    specialRequest: "",
    number: "",
  });

  const handlePartySizeChange = (e) => {
    const size = parseInt(e.target.value);
    setPartySize(size);
    setBookingCost(getBookingCost(size));
    if (selectedSlot) {
      fetchAvailableTablesForSlot(selectedSlot);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    if (isDateClosed(selectedDate)) {
      setBookingError("The restaurant is closed on this day");
      return;
    }
  
    if (!userId) {
      setBookingError("You must sign in or continue as a guest.");
      return;
    }
  
    if (!email.trim()) {
      setBookingError("Email is required.");
      return;
    }
  
    if (!name.trim()) {
      setBookingError("Name is required.");
      return;
    }
  
    if (!fallbackMode && !selectedTable) {
      setBookingError("Please select a table.");
      return;
    }
  
    const existingReservation = reservations.find(
      (r) => r.user_id === userId && r.time === selectedSlot && r.date === selectedDate
    );
  
    if (existingReservation) {
      setBookingError("You already have a reservation for this time slot on this date.");
      toast.error("Duplicate reservation not allowed.");
      return;
    }
  
    if (bookingCost > 0) {
      setPaymentInitialized(true);
      setOpenDialog(false);
      setShowPaystack(true);
      return;
    }
  
    await saveReservation();
  };
  
  const saveReservation = async () => {
    const reservationToken = crypto.randomUUID();
    setIsLoading(true);
  
    try {
      const [
        { data: ownerData, error: ownerError },
        { data: restaurantData, error: restaurantError }
      ] = await Promise.all([
        supabase
          .from('users')
          .select('email')
          .eq('owner_id', restaurant.owner_id)
          .single(),
        supabase
          .from('restaurants')
          .select('name')
          .eq('id', restaurant.id)
          .single()
      ]);
  
      if (ownerError || restaurantError) {
        throw new Error('Could not verify restaurant details');
      }
  
      if (!ownerData?.email || !email) {
        throw new Error('Missing required email addresses');
      }

      let tableInfo = "Not specified";
      if (restaurant.table_assignment_mode !== 'manual' && !fallbackMode && selectedTable) {
        const table = allTables.find(t => t.id === selectedTable);
        if (table) {
          const tableType = tableTypes.find(t => t.id === table.table_type_id);
          if (tableType) {
            tableInfo = `${tableType.name} (Table "${table.table_number}")`;
          }
        }
      } else if (restaurant.table_assignment_mode === 'manual') {
        tableInfo = "Manual assignment required - staff will assign upon arrival";
      }
  
      const reservationData = {
        restaurant_id: restaurant.id,
        time: selectedSlot,
        date: selectedDate,
        user_id: userId === "guest" ? "00000000-0000-0000-0000-000000000000" : userId,
        email,
        name,
        reservation_token: reservationToken,
        special_request: occasionDetails?.specialRequest || '',
        occassion: occasionDetails?.occasion || '',
        number: occasionDetails?.number || '',
        people: partySize,
        paid: bookingCost > 0,
        booking_cost: bookingCost,
        table_id: restaurant.table_assignment_mode !== 'manual' && !fallbackMode ? selectedTable : null
      };
  
      const { error: dbError } = await supabase.from("reservations").insert([reservationData]);
      if (dbError) throw new Error(`Database error: ${dbError.message}`);
  
      const dashboardLink = `https://danloski.com/profile?tab=reservations`;
      
      const restaurantEmailParams = {
        to_email: ownerData.email,
        restaurant_name: restaurantData.name,
        customer_name: name,
        customer_email: email,
        customer_phone: occasionDetails?.number || 'Not provided',
        reservation_date: new Date(selectedDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        reservation_time: selectedSlot,
        party_size: (partySize).toString(),
        occasion: occasionDetails?.occasion || 'None specified',
        special_request: occasionDetails?.specialRequest || 'None',
        dashboard_link: dashboardLink,
        current_year: new Date().getFullYear().toString(),
        table_type: tableInfo,
        assignment_mode: restaurant.table_assignment_mode === 'manual' ? 'manual' : 'automatic',
        requires_table_assignment: restaurant.table_assignment_mode === 'manual' ? 'YES' : 'NO'
      };
  
      const customerEmailParams = {
        to_email: email,
        restaurant_email: ownerData.email,
        restaurant_name: restaurantData.name,
        restaurant_phone: restaurant.phone || 'Not provided',
        customer_name: name,
        customer_email: email,
        reservation_date: new Date(selectedDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        reservation_time: selectedSlot,
        party_size: (partySize).toString(),
        occasion: occasionDetails?.occasion || 'None specified',
        current_year: new Date().getFullYear().toString(),
        table_type: tableInfo
      };
  
      console.log('Sending emails with params:', { restaurantEmailParams, customerEmailParams });
  
      await Promise.all([
        emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_RESTAURANT_TEMPLATE_ID,
        restaurantEmailParams,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
      ),
      emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_CUSTOMER_TEMPLATE_ID,
        customerEmailParams,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
      )
    ]);

    setNotification({
      type: 'success',
      title: 'Reservation Successful',
      message: 'Your reservation is confirmed! Confirmation emails have been sent.'
    });

    const { data: newReservations } = await supabase
      .from("reservations")
      .select("time, date, user_id, table_id, people")
      .eq("restaurant_id", restaurant.id)
      .eq("date", selectedDate);

    setReservations(newReservations);

    const updatedAvailableSlots = timeSlots.filter(slot => {
      const reservationsForSlot = newReservations.filter(r => r.time === slot);
      const bookedTablesForSlot = new Set(reservationsForSlot.map(r => r.table_id));
      
      if (fallbackMode) return true;
      
      return allTables.some(table => {
        const tableType = tableTypes.find(t => t.id === table.table_type_id);
        return !bookedTablesForSlot.has(table.id) && tableType?.capacity >= partySize;
      });
    });

    setAvailableSlots(updatedAvailableSlots);
    
    setReservations([...reservations, reservationData]);
    localStorage.setItem("reservationToken", reservationToken);
    localStorage.setItem("reservationEmail", email);

    setTimeout(() => {
      router.push(userId === "guest" ? "/guests" : "/reservations");
    }, 2200);

  } catch (error) {
    console.error('Reservation error:', error);
    setNotification({
      type: 'error',
      title: 'Booking Failed',
      message: error.message || 'An error occurred while processing your reservation'
    });
  } finally {
    setIsLoading(false);
  }
  };

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return <LoadingAnimation />
  }
  if (!restaurant) return (
    <NotFound />
  )

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#fff',
          },
        }}
      />
      <RestaurantHeader />
      <ReservationNotification 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />

      {/* Hero Section */}
      <HeroCarousel restaurant={restaurant} />

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Info */}
          <div className="lg:w-2/5">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button 
                className={`py-3 px-6 font-medium ${activeTab === 'reserve' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('reserve')}
              >
                Reserve
              </button>
              <button 
                className={`py-3 px-6 font-medium ${activeTab === 'info' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('info')}
              >
                Info
              </button>
            </div>

            {activeTab === 'reserve' ? (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-6">Make a Reservation</h2>
                
                <DateSelector 
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  isDateClosed={isDateClosed}
                  closureDays={closureDays}
                />

                <PartySizeSelector 
                  partySize={partySize}
                  handlePartySizeChange={handlePartySizeChange}
                  bookingCost={bookingCost}
                  bookingCostTiers={bookingCostTiers}
                />

                <TimeSlotsGrid 
                  availableSlots={availableSlots}
                  handleOpenDialog={handleOpenDialog}
                  fallbackMode={fallbackMode}
                  restaurant={restaurant}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">About {restaurant.name}</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {restaurant.description || "No description available."}
                </p>
                
                <div className="space-y-4">
                  {restaurant.cuisine_type && (
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mt-1 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      <div>
                        <h3 className="font-semibold">Cuisine</h3>
                        <p className="text-gray-600">{restaurant.cuisine_type}</p>
                      </div>
                    </div>
                  )}
                  
                  {restaurant.phone && (
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mt-1 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold">Phone</h3>
                        <p className="text-gray-600">{restaurant.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {restaurant.email && (
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mt-1 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold">Email</h3>
                        <p className="text-gray-600">{restaurant.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {restaurant.website && (
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mt-1 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <div>
                        <h3 className="font-semibold">Website</h3>
                        <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                          Visit website
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map Section */}
            {(restaurant.location || restaurant.address) && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Location</h3>
                {restaurant.location && (
                  <div className="h-64 bg-gray-100 rounded-lg overflow-hidden mb-4">
                    <MapWithNoSSR 
                      location={restaurant.location}
                      interactive={true}
                      address={restaurant.address}
                    />
                  </div>
                )}
                {restaurant.address && (
                  <p className="text-gray-600 flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {restaurant.address}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Gallery */}
          <div className="lg:w-3/5">
            {/*<PhotoGallery 
              restaurant={restaurant} 
            />*/}

            {/* Reviews Section */}
            <Reviews />
          </div>
        </div>
      </div>

      <BookingDialog
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        selectedSlot={selectedSlot}
        selectedDate={selectedDate}
        availableTables={availableTables}
        fallbackMode={fallbackMode}
        userId={userId}
        setUserId={setUserId}
        bookingCost={bookingCost}
        bookingCostTiers={bookingCostTiers}
        showPaystack={showPaystack}
        setShowPaystack={setShowPaystack}
        partySize={partySize}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        occasionDetails={occasionDetails}
        setOccasionDetails={setOccasionDetails}
        handleBooking={handleBooking}
        isLoading={isLoading}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
        paystackConfig={paystackConfig}
        onPaystackSuccess={onPaystackSuccess}
        onPaystackClose={onPaystackClose}
        paymentSuccess={paymentSuccess}
        restaurant={restaurant}
      />

      <PaymentModal
        paymentInitialized={paymentInitialized}
        setPaymentInitialized={setPaymentInitialized}
        setOpenDialog={setOpenDialog}
        bookingCost={bookingCost}
        paystackConfig={paystackConfig}
        onPaystackSuccess={onPaystackSuccess}
        onPaystackClose={onPaystackClose}
      />
    </div>
  );
}