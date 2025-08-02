'use client';

export default function TimeSlotsGrid({ 
  availableSlots, 
  handleOpenDialog,
  fallbackMode 
}) {
  return (
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
  );
}