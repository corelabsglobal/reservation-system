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
  onPaystackClose,
  restaurant
}) {

  const isManualAssignment = restaurant?.table_assignment_mode === 'manual';

  // Check if we're showing tables with higher capacity
  const showingHigherCapacityTables = availableTables.some(group => 
    group.type.capacity > partySize
  ) && !availableTables.some(group => 
    group.type.capacity === partySize
  );

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent className="bg-gray-800 text-white border border-gray-700 shadow-xl rounded-lg p-0 max-w-md overflow-hidden">
        <div className="max-h-[80vh] flex flex-col">
          {/* Header section - stays fixed */}
          <DialogHeader className="p-6 pb-0 bg-gray-800 sticky top-0 z-10">
            <DialogTitle className="text-yellow-400 text-xl">Book a Table</DialogTitle>
            <DialogDescription className="text-gray-300">
              {selectedSlot ? `Booking for ${selectedSlot} on ${selectedDate}` : ""}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable content */}
          <div className="overflow-y-auto px-6 pb-6 flex-1 hide-scrollbar">
            <div className="flex flex-col gap-4 pt-4">
              {availableTables.length > 0 || fallbackMode ? (
                <>
                  {!userId ? (
                    <div className="bg-gray-700/30 p-4 rounded-lg">
                      <p className="text-gray-300 mb-3">
                        You are not signed in. You can either sign in or continue as a guest.
                      </p>
                      <div className="flex gap-3">
                        <button
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                          onClick={() => {
                            window.location.href = "/signin";
                          }}
                        >
                          Sign In
                        </button>
                        <button
                          className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-md transition-all"
                          onClick={() => setUserId("guest")}
                        >
                          Continue as Guest
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/*isManualAssignment && (
                        <div className="bg-blue-600/20 p-3 rounded-md border border-blue-400/50">
                          <p className="text-blue-400">
                            This restaurant uses manual table assignment. The staff will assign 
                            your table based on availability when you arrive.
                          </p>
                        </div>
                      )*/}

                      {fallbackMode && !isManualAssignment && (
                        <div className="bg-yellow-600/20 p-3 rounded-md border border-yellow-400/50">
                          <p className="text-yellow-400">
                            This restaurant hasn't set up specific tables yet. Your reservation will be confirmed based on general availability.
                          </p>
                        </div>
                      )}

                      {!isManualAssignment && showingHigherCapacityTables && (
                        <div className="bg-blue-600/20 p-3 rounded-md border border-blue-400/50">
                          <p className="text-blue-400">
                            No exact matches found. Showing tables with higher capacity.
                          </p>
                        </div>
                      )}

                      {bookingCost > 0 && !paymentSuccess && (
                        <div className="bg-gray-700/30 p-4 rounded-lg">
                          <p className="text-yellow-400 mb-2">
                            Deposit: <span className="font-bold">{bookingCost} GHS</span> 
                            {bookingCostTiers.length > 0 && (
                              <span className="text-sm text-gray-300 ml-2">
                                (for {partySize} {partySize === 1 ? 'person' : 'people'})
                              </span>
                            )}
                          </p>
                          {showPaystack && (
                            <div className="relative z-50 mt-3">
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

                      {!isManualAssignment && availableTables.length > 0 && (
                        <div className="mt-2">
                          <h3 className="text-md font-medium text-gray-300 mb-3">
                            Available Tables for {partySize} {partySize === 1 ? 'person' : 'people'}
                          </h3>
                          <div className="space-y-3">
                            {availableTables.map((group) => (
                              <div key={group.type.id} className="bg-gray-700/30 p-3 rounded-md border border-gray-600/50">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium text-yellow-400">
                                    {group.type.name}
                                  </h4>
                                  <span className="text-sm bg-gray-600/50 px-2 py-1 rounded-full">
                                    {group.type.capacity} seats
                                  </span>
                                </div>
                                <p className="text-sm text-gray-300 mt-1">
                                  {group.type.description || 'No description available'}
                                </p>
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                  {group.tables.map((table) => (
                                    <button
                                      key={table.id}
                                      onClick={() => setSelectedTable(table.id)}
                                      className={`px-2 py-1 text-sm rounded-md transition-colors ${
                                        selectedTable === table.id
                                          ? 'bg-yellow-500 text-black font-medium'
                                          : 'bg-gray-600 hover:bg-gray-500'
                                      }`}
                                    >
                                      {table.table_number}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleBooking} className="mt-4 flex flex-col gap-4">
                        {userId === "guest" && (
                          <>
                            <input
                              type="text"
                              placeholder="Your Name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                              className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder-gray-400"
                            />
                            <input
                              type="email"
                              placeholder="Your Email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder-gray-400"
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
                              className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder-gray-400"
                            />
                            <input
                              type="email"
                              placeholder="Your Email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder-gray-400"
                            />
                            <OccasionDetails 
                              onChange={setOccasionDetails} 
                              partySize={partySize}
                            />
                          </>
                        )}
                        <button
                          type="submit"
                          className="mt-2 px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold rounded-md transition-all disabled:opacity-50 flex items-center justify-center"
                          disabled={(!fallbackMode && !selectedTable) || isLoading}
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            'Confirm Booking'
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </>
              ) : (
                <div className="bg-red-600/10 p-4 rounded-lg border border-red-400/50">
                  <p className="text-red-400">
                    {fallbackMode 
                      ? "No available slots for selected date. Please contact the restaurant directly at " + restaurant.phone
                      : "No available slots for selected date/party size. Please contact the restaurant directly at " + restaurant.phone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fixed footer */}
          <div className="p-4 bg-gray-800 border-t border-gray-700 sticky bottom-0">
            <DialogClose asChild>
              <button className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 transition-colors rounded-md text-white">
                Close
              </button>
            </DialogClose>
          </div>
        </div>

        <style jsx>{`
          .hide-scrollbar::-webkit-scrollbar {
            width: 0;
            background: transparent;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}