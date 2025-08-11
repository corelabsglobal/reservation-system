'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TimeSlotsSelect({ 
  availableSlots, 
  handleOpenDialog,
  fallbackMode 
}) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelect = (slot) => {
    setSelectedSlot(slot);
    setIsDropdownOpen(false);
    handleOpenDialog(slot);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (availableSlots.length === 0) {
    return (
      <div className="mt-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-amber-400 mb-3">Available Reservations</h2>
        <p className="text-gray-400 text-sm sm:text-md">
          {fallbackMode 
            ? "No available slots for selected date." 
            : "No available slots for selected date/party size."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl sm:text-2xl font-semibold text-amber-400 mb-3">Reservation Times</h2>
      
      {/* Main Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-6 py-4 bg-opacity-20 backdrop-blur-lg bg-amber-900 border border-amber-600 rounded-xl shadow-lg flex justify-between items-center transition-all duration-300 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
        >
          <span className="text-amber-100 text-lg font-medium">
            {selectedSlot || "Select your preferred time"}
          </span>
          <motion.span
            animate={{ rotate: isDropdownOpen ? 180 : 0 }}
            className="text-amber-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.span>
        </button>

        {/* Dropdown with animation */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-10 mt-2 w-full bg-gradient-to-br from-amber-950 to-amber-900 border border-amber-700 rounded-xl shadow-xl overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {availableSlots.map((slot) => (
                  <motion.div
                    key={slot}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 cursor-pointer transition-all duration-200 hover:bg-amber-800 hover:bg-opacity-50 border-b border-amber-700 last:border-b-0"
                    onClick={() => handleSelect(slot)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-amber-100 font-medium">{slot}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Time Display */}
      {selectedSlot && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-6 bg-gradient-to-r from-amber-900 to-amber-800 rounded-xl border border-amber-700 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Selected Time</h3>
              <p className="text-2xl font-bold text-amber-100 mt-1">{selectedSlot}</p>
            </div>
            <button
              onClick={() => handleOpenDialog(selectedSlot)}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg text-white font-semibold shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              Confirm Reservation
            </button>
          </div>
        </motion.div>
      )}

      {/* Custom scrollbar styling */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(180, 83, 9, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(217, 119, 6, 0.5);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}