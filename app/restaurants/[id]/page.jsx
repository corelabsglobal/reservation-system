'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import toast, { Toaster } from "react-hot-toast";
import Header from "@/app/components/structure/header";
import { useRouter } from "next/navigation";
import OccasionDetails from "@/app/components/restaurants/OccassionDetails";
import emailjs from '@emailjs/browser';
import dynamic from "next/dynamic";

const PaystackButton = dynamic(
  () => import("react-paystack").then((mod) => mod.PaystackButton),
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
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

  const timeSlots = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];

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
        // First try to fetch by ID (numeric ID case)
        let { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", id)
          .single();

        // If not found by ID, try to fetch by URL (slug case)
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

        if (restaurantData.booking_cost) {
          setBookingCost(restaurantData.booking_cost);
        }

        // Fetch table types and their tables using the actual restaurant ID
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

        // Check if we need fallback mode (no tables defined)
        if (tableData.length === 0 || tables.length === 0) {
          setFallbackMode(true);
          toast("This restaurant hasn't set up tables yet. Using basic reservation system.", {
            icon: 'ℹ️',
          });
        }

        // Fetch reservations for the selected date using actual restaurant ID
        const { data: reservationsData, error: reservationsError } = await supabase
          .from("reservations")
          .select("time, date, user_id, table_id, people")
          .eq("restaurant_id", actualRestaurantId)
          .eq("date", selectedDate);

        if (reservationsError) throw reservationsError;
        setReservations(reservationsData);

        // Process available slots based on reservations
        const bookedTables = new Set(reservationsData.map(r => r.table_id));
        const availableTablesForSlots = new Map();

        timeSlots.forEach(slot => {
          const availableTablesForSlot = tables.filter(table => 
            !bookedTables.has(table.id)
          );
          availableTablesForSlots.set(slot, availableTablesForSlot);
        });

        // Filter time slots with available tables that can accommodate party size
        {/*const filteredSlots = timeSlots.filter(slot => {
          const slotTables = availableTablesForSlots.get(slot) || [];
          
          if (fallbackMode) {
            return true;
          }
          
          return slotTables.some(table => {
            const tableType = tableData.find(t => t.id === table.table_type_id);
            return tableType?.capacity >= partySize;
          });
        });*/}

        const filteredSlots = timeSlots.filter(slot => {
          const slotTables = availableTablesForSlots.get(slot) || [];
          
          if (fallbackMode) return true;
          
          // Group available tables by type
          const availableTypes = new Set();
          slotTables.forEach(table => {
            const tableType = tableData.find(t => t.id === table.table_type_id);
            if (tableType?.capacity >= partySize) {
              availableTypes.add(table.table_type_id);
            }
          });
          
          return availableTypes.size > 0;
        });

        setAvailableSlots(filteredSlots);
      } catch (err) {
        console.error("Error fetching data:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [id, selectedDate, partySize, reservations]);

  const fetchAvailableTablesForSlot = async (timeSlot) => {
    try {
      if (fallbackMode) {
        setAvailableTables([]);
        setSelectedTable(null);
        return;
      }

      // Get reservations for this time slot using the actual restaurant ID from state
      const { data: reservationsForSlot, error } = await supabase
        .from("reservations")
        .select("table_id")
        .eq("restaurant_id", restaurant?.id)
        .eq("date", selectedDate)
        .eq("time", timeSlot);

      if (error) throw error;

      const bookedTableIds = new Set(reservationsForSlot.map(r => r.table_id));
      
      // Get available tables that can accommodate party size
      const suitableTables = allTables.filter(table => {
        const tableType = tableTypes.find(t => t.id === table.table_type_id);
        return !bookedTableIds.has(table.id) && 
               tableType?.capacity >= partySize;
      });

      // Group by table type for display
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

  const paystackConfig = {
    reference: new Date().getTime().toString(),
    email: email || "kbtechnologies2@gmail.com",
    amount: bookingCost * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    currency: "GHS",
    metadata: {
      restaurant_id: restaurant?.id, // Use the actual restaurant ID from state
      user_id: userId,
    },
  };
  
  const onPaystackSuccess = async (response) => {
    setPaymentSuccess(true);
    toast.success("Payment successful! Proceeding with reservation...");
    await saveReservation();
    setPaymentInitialized(false);
  };
  
  const onPaystackClose = () => {
    toast.error("Payment canceled or failed. Please try again.");
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
    if (selectedSlot) {
      fetchAvailableTablesForSlot(selectedSlot);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);
  
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
      // Fetch owner email and restaurant name
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
          .eq('id', restaurant.id) // Use the actual restaurant ID from state
          .single()
      ]);
  
      if (ownerError || restaurantError) {
        throw new Error('Could not verify restaurant details');
      }
  
      // Validate emails exist
      if (!ownerData?.email || !email) {
        throw new Error('Missing required email addresses');
      }
  
      // Prepare reservation data
      const reservationData = {
        restaurant_id: restaurant.id, // Use the actual restaurant ID from state
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
        table_id: !fallbackMode ? selectedTable : null
      };
  
      // 1. Save to database
      const { error: dbError } = await supabase.from("reservations").insert([reservationData]);
      if (dbError) throw new Error(`Database error: ${dbError.message}`);
  
      // 2. Send emails with EmailJS
      const dashboardLink = 'http://reservation-wheat.vercel.app/profile';
      
      // Restaurant email template parameters
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
        current_year: new Date().getFullYear().toString()
      };
  
      // Customer email template parameters
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
      };
  
      console.log('Sending emails with params:', { restaurantEmailParams, customerEmailParams });
  
      // Send both emails in parallel
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
  
      // Success flow
      toast.success("Reservation successful! Confirmation emails sent.");
      
      // Update state and local storage
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
      const { data: newReservations } = await supabase
        .from("reservations")
        .select("time, date, user_id, table_id, people")
        .eq("restaurant_id", restaurant.id)
        .eq("date", selectedDate);
      setReservations(newReservations);
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
      <Toaster position="top-right" />
      <Header />
      <div className="mt-14 max-w-6xl w-full mx-auto flex flex-col md:flex-row gap-8 p-4 md:p-6 rounded-lg shadow-2xl bg-gray-800/90 backdrop-blur-md">
        
        {/* Left - Restaurant Image */}
        <div className="md:w-1/2">
          <img
            src={restaurant.restaurant_image || "/images/golden-lounge.jpeg"}
            alt={restaurant.name}
            className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] object-cover rounded-lg shadow-lg"
          />
        </div>

        {/* Right - Content */}
        <div className="md:w-1/2 flex flex-col justify-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 mb-2">{restaurant.name}</h1>
          <p className="text-gray-300 text-sm sm:text-md md:text-lg">{restaurant.location}</p>
          <p className="mt-3 text-gray-300 leading-relaxed text-sm sm:text-md md:text-lg">
            {restaurant.description || "No description available."}
          </p>
          <div className="mt-4">
            <label className="text-yellow-400 font-semibold">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400 w-full mt-2"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Party Size Selector */}
          <div className="mt-4">
            <label className="text-yellow-400 font-semibold">Party Size:</label>
            <select
              value={partySize}
              onChange={handlePartySizeChange}
              className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400 w-full mt-2"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                <option key={size} value={size}>{size} {size === 1 ? 'person' : 'people'}</option>
              ))}
            </select>
          </div>

          {/* Reservation Section */}
          <div className="mt-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-yellow-400 mb-3">Available Reservations</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableSlots.length > 0 ? (
                availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => handleOpenDialog(slot)}
                    className="px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-orange-500 hover:to-orange-700 transition-all rounded-lg shadow-md text-sm sm:text-lg font-semibold"
                  >
                    {slot}
                  </button>
                ))
              ) : (
                <p className="text-gray-400 text-sm sm:text-md">
                  {fallbackMode 
                    ? "No available slots for selected date." 
                    : "No available slots for selected date/party size."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-gray-800 text-white border border-gray-700 shadow-xl rounded-lg p-6 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-lg">Book a Table</DialogTitle>
            <DialogDescription>
              {selectedSlot ? `Booking for ${selectedSlot} on ${selectedDate}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {availableTables.length > 0 || fallbackMode ? (
              <>
                {!userId ? (
                  <div>
                    <p className="text-gray-400 mb-2">
                      You are not signed in. You can either sign in or continue as a guest.
                    </p>
                    <div className="flex gap-3">
                      <button
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                        onClick={() => {
                          window.location.href = "/signin";
                        }}
                      >
                        Sign In
                      </button>
                      <button
                        className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 transition-all text-white rounded-md"
                        onClick={() => setUserId("guest")}
                      >
                        Continue as Guest
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    

                    {fallbackMode && (
                      <div className="bg-yellow-600/20 p-3 rounded-md border border-yellow-400">
                        <p className="text-yellow-400">
                          This restaurant hasn't set up specific tables yet. Your reservation will be confirmed based on general availability.
                        </p>
                      </div>
                    )}

                    {bookingCost > 0 && !paymentSuccess && (
                      <div>
                        <p className="text-yellow-400 mb-2">
                          A booking fee of {bookingCost} GHS is required.
                        </p>
                        {showPaystack && (
                          <div className="relative z-50">
                          <PaystackButton
                            {...paystackConfig}
                            text="Pay Now"
                            onSuccess={onPaystackSuccess}
                            onClose={onPaystackClose}
                            className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded-lg hover:opacity-80 transition-all disabled:opacity-50 w-full"
                          />
                          </div>
                        )}
                      </div>
                    )}
                    <form onSubmit={handleBooking} className="mt-4 flex flex-col gap-3">
                      {userId === "guest" && (
                        <>
                          <input
                            type="text"
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400"
                          />
                          <input
                            type="email"
                            placeholder="Your Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400"
                          />
                          <OccasionDetails 
                            onChange={(data) => setOccasionDetails(prev => ({ ...prev, ...data }))} 
                          />
                        </>
                      )}
                      {userId !== "guest" && (
                        <>
                          <input
                            type="text"
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400"
                          />
                          <input
                            type="email"
                            placeholder="Your Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400"
                          />
                          <OccasionDetails 
                            onChange={setOccasionDetails} 
                            partySize={partySize}
                          />
                        </>
                      )}
                      <button
                        type="submit"
                        className="mt-5 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-md"
                        disabled={!fallbackMode && !selectedTable || isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </div>
                        ) : (
                          'Confirm Booking'
                        )}
                      </button>
                    </form>
                  </>
                )}
              </>
            ) : (
              <p className="text-red-400">
                {fallbackMode 
                  ? "No availability for selected time." 
                  : "No tables available for your party size at this time."}
              </p>
            )}
          </div>

          <DialogClose asChild>
            <button className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 transition-all rounded-md text-white">Close</button>
          </DialogClose>
        </DialogContent>
      </Dialog>
      {paymentInitialized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="relative z-10 bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <p className="mb-2">
              A reservation cost of {bookingCost} GHS is required.
            </p>
            <PaystackButton
              {...paystackConfig}
              text="Pay Now"
              onSuccess={onPaystackSuccess}
              onClose={onPaystackClose}
              className="w-full bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-3 rounded-lg hover:opacity-80 transition-all mt-2"
            />
            <button 
              onClick={() => {
                setPaymentInitialized(false);
                setOpenDialog(true);
              }}
              className="mt-4 w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}