'use client';

import dynamic from "next/dynamic";
import OccasionDetails from "./OccassionDetails";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

const PaystackButton = dynamic(
  () => import("react-paystack").then((mod) => mod.PaystackButton),
  { ssr: false }
);

export default function BookingDialog({
  openDialog,
  setOpenDialog,
  selectedSlot,
  selectedDate,
  availableTables,
  fallbackMode,
  userId,
  setUserId,
  bookingCost,
  bookingCostTiers,
  showPaystack,
  setShowPaystack,
  partySize,
  name,
  setName,
  email,
  setEmail,
  occasionDetails,
  setOccasionDetails,
  handleBooking,
  isLoading,
  selectedTable,
  setSelectedTable,
  paymentSuccess,
  paystackConfig,
  onPaystackSuccess,
  onPaystackClose
}) {

  return (
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
                        Deposit: <span className="font-bold">{bookingCost} GHS</span> 
                        {bookingCostTiers.length > 0 && (
                          <span className="text-sm text-gray-400 ml-2">
                            (for {partySize} {partySize === 1 ? 'person' : 'people'})
                          </span>
                        )}
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
  );
}