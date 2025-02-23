"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import toast, { Toaster } from "react-hot-toast";

export default function RestaurantPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tablesLeft, setTablesLeft] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [userId, setUserId] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
      } else {
        setUserId(userData?.user?.id);
      }
    }

    fetchUser();
  }, []);

  // Fixed time slots (10 AM to 10 PM, every 2 hours)
  const timeSlots = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];

  useEffect(() => {
    if (!id) return;

    const fetchRestaurantData = async () => {
      try {
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", id)
          .single();

        if (restaurantError) throw restaurantError;
        setRestaurant(restaurantData);

        // Fetch reservations
        const { data: reservationsData, error: reservationsError } = await supabase
          .from("reservations")
          .select("time, date")
          .eq("restaurant_id", id);

        if (reservationsError) throw reservationsError;
        setReservations(reservationsData);

        // Process available slots based on reservations
        const today = new Date().toISOString().split("T")[0];
        const bookedSlots = new Map();

        reservationsData.forEach(({ date, time }) => {
          if (!bookedSlots.has(date)) bookedSlots.set(date, new Map());
          const timeCount = bookedSlots.get(date).get(time) || 0;
          bookedSlots.get(date).set(time, timeCount + 1);
        });

        const slotsForToday = bookedSlots.get(today) || new Map();
        const filteredSlots = timeSlots.filter((slot) => {
          const bookedCount = slotsForToday.get(slot) || 0;
          return bookedCount < restaurantData.tables; // Exclude fully booked slots
        });

        setAvailableSlots(filteredSlots);
      } catch (err) {
        console.error("Error fetching data:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [id]);

  // Handle opening the dialog
  const handleOpenDialog = (slot) => {
    const today = new Date().toISOString().split("T")[0];
    const bookedCount = reservations.filter((r) => r.date === today && r.time.startsWith(slot)).length;
    setTablesLeft(restaurant.tables - bookedCount);
    setSelectedSlot(slot);
    setOpenDialog(true);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    if (!userId) {
      setBookingError("User not authenticated.");
      return;
    }

    if (!email.trim()) {
      setBookingError("Email is required.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase.from("reservations").insert([
      {
        restaurant_id: id,
        time: selectedSlot,
        date: today,
        user_id: userId,
        email,
        name,
      },
    ]);

    if (error) {
      setBookingError(error.message);
      toast.error(`Booking failed: ${error.message}`);
    } else {
      setBookingSuccess("Reservation successful!");
      toast.success("Reservation successful!");
      setReservations([...reservations, { time: selectedSlot, date: today }]);
      setAvailableSlots(availableSlots.filter((slot) => slot !== selectedSlot));
      setTimeout(() => setOpenDialog(false), 2000); 
    }
  };

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;
  if (!restaurant) return <p className="text-center text-red-500">Restaurant not found.</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 md:px-6 py-10 flex items-center justify-center">
      <Toaster />
      <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row gap-8 p-4 md:p-6 rounded-lg shadow-2xl bg-gray-800/90 backdrop-blur-md">
        
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
                <p className="text-gray-400 text-sm sm:text-md">No available slots.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-gray-800 text-white border border-gray-700 shadow-xl rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-lg">Book a Table</DialogTitle>
            <DialogDescription>
              {selectedSlot ? `Booking for ${selectedSlot}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <p className="text-gray-300">Tables remaining: <span className="font-bold text-yellow-400">{tablesLeft}</span></p>

            {tablesLeft > 0 ? (
              <form onSubmit={handleBooking}>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-3 bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                {bookingError && <p className="text-red-500">{bookingError}</p>}
                <button
                  type="submit"
                  className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 transition-all px-4 py-2 rounded-md font-semibold"
                >
                  Confirm Booking
                </button>
              </form>
            ) : (
              <p className="text-red-400">No more tables available for this time slot.</p>
            )}
          </div>

          <DialogClose asChild>
            <button className="w-full mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 transition-all rounded-md text-white">Close</button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}