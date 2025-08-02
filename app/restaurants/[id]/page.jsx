'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";
import Header from "@/app/components/structure/header";
import emailjs from '@emailjs/browser';
import { generateTimeSlots } from "@/utils/timeSlots";
import RestaurantHeader from "@/app/components/restaurants/RestaurantHeader";
import DateSelector from "@/app/components/restaurants/DateSelector";
import PartySizeSelector from "@/app/components/restaurants/PartySizeSelector";
import TimeSlotsGrid from "@/app/components/restaurants/TimeSlotsGrid";
import BookingDialog from "@/app/components/restaurants/BookingDialog";
import PaymentModal from "@/app/components/restaurants/PaymentModal";

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
  const [closureDays, setClosureDays] = useState([]);

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
            toast("This restaurant hasn't set up tables yet. Using basic reservation system.", {
              icon: 'ℹ️',
              id: 'fallback-notice'
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

          const bookedCountByType = {};
          for (const res of reservationsForSlot) {
            const table = allTables.find(t => t.id === res.table_id);
            if (!table) continue;
            if (!bookedCountByType[table.table_type_id]) {
              bookedCountByType[table.table_type_id] = 0;
            }
            bookedCountByType[table.table_type_id]++;
          }

          return Object.entries(tableTypeCounts).some(([typeId, info]) => {
            return (
              info.capacity >= partySize &&
              (bookedCountByType[typeId] || 0) < info.total
            );
          });
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
      
      const suitableTables = allTables.filter(table => {
        const tableType = tableTypes.find(t => t.id === table.table_type_id);
        return !bookedTableIds.has(table.id) && 
               tableType?.capacity >= partySize;
      });

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
        toast.error(`Restaurant is closed on ${selectedDate}. Showing next available date: ${nextOpenDate}`,{
          id: 'closed-notice'
        });
      } else {
        toast.error("Could not find an available date in the next 30 days",{
          id: 'unavailable-notice'
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
    toast.success("Payment successful! Proceeding with reservation...",{
      id: 'payment-success'
    });
    await saveReservation();
    setPaymentInitialized(false);
  };
  
  const onPaystackClose = () => {
    toast.error("Payment canceled or failed. Please try again.",{
      id: 'payment-failed'
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

      let tableTypeName = "Not specified";
      if (!fallbackMode && selectedTable) {
        const table = allTables.find(t => t.id === selectedTable);
        if (table) {
          const tableType = tableTypes.find(t => t.id === table.table_type_id);
          if (tableType) {
            tableTypeName = tableType.name;
          }
        }
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
        table_id: !fallbackMode ? selectedTable : null
      };
  
      const { error: dbError } = await supabase.from("reservations").insert([reservationData]);
      if (dbError) throw new Error(`Database error: ${dbError.message}`);
  
      const dashboardLink = 'https://danloski.com/profile';
      
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
        table_type: tableTypeName
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
        table_type: tableTypeName
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
  
      toast.success("Reservation successful! Confirmation emails sent.");

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
      toast.error(`Booking failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-pulse text-2xl font-medium text-indigo-400">Loading restaurants...</div>
      </div>
    )
  }
  if (!restaurant) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <p className="text-center text-red-500">Restaurant not found.</p>
    </div>
  )

  return (
    <div className="relative min-h-screen bg-gray-900 text-white px-4 md:px-6 py-10 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-50"
        style={{ backgroundImage: "url('/images/background.jpeg')" }}
      />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <Header />
      <div className="mt-14 max-w-6xl w-full mx-auto flex flex-col md:flex-row gap-8 p-4 md:p-6 rounded-lg shadow-2xl bg-gray-800/90 backdrop-blur-md">
        <RestaurantHeader restaurant={restaurant} />
        
        <div className="md:w-1/2 flex flex-col justify-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 mb-2">{restaurant.name}</h1>
          <p className="text-gray-300 text-sm sm:text-md md:text-lg">{restaurant.location}</p>
          <p className="mt-3 text-gray-300 leading-relaxed text-sm sm:text-md md:text-lg">
            {restaurant.description || "No description available."}
          </p>
          
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
          />
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