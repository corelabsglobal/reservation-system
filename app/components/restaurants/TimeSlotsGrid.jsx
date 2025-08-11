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
  const slotsContainerRef = useRef(null);

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
    <div className="mt-6 space-y-4" ref={slotsContainerRef}>
      <h2 className="text-xl sm:text-2xl font-semibold text-amber-400 mb-3">Reservation Times</h2>
      
      {/* Elegant Grid View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {availableSlots.map((slot) => (
          <motion.button
            key={slot}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(slot)}
            className={`py-3 px-2 rounded-lg border transition-all duration-200 ${
              selectedSlot === slot
                ? 'bg-gradient-to-br from-amber-600 to-amber-700 border-amber-500 shadow-lg'
                : 'bg-amber-900/30 border-amber-700 hover:bg-amber-800/40 hover:border-amber-600'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-amber-100 font-medium text-sm sm:text-base">{slot}</span>
              {selectedSlot === slot && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-1 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Alternative Compact Selector (hidden by default) */}
      <div className="hidden">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3 bg-opacity-20 backdrop-blur-lg bg-amber-900 border border-amber-600 rounded-lg shadow flex justify-between items-center transition-all duration-200 hover:bg-opacity-30 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:ring-opacity-50"
          >
            <span className="text-amber-100 text-sm font-medium truncate">
              {selectedSlot || "Select time"}
            </span>
            <motion.span
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              className="text-amber-300 ml-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.span>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute z-10 mt-1 w-full bg-gradient-to-br from-amber-950 to-amber-900 border border-amber-700 rounded-lg shadow-lg overflow-hidden"
                style={{
                  maxHeight: slotsContainerRef.current
                    ? `${slotsContainerRef.current.offsetHeight - 100}px`
                    : '200px'
                }}
              >
                <div className="overflow-y-auto custom-scrollbar max-h-[inherit]">
                  {availableSlots.map((slot) => (
                    <motion.div
                      key={slot}
                      whileHover={{ backgroundColor: 'rgba(180, 83, 9, 0.4)' }}
                      className="px-3 py-2 cursor-pointer transition-colors duration-150 hover:bg-amber-800/50 border-b border-amber-700 last:border-b-0"
                      onClick={() => handleSelect(slot)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-amber-100 text-sm font-medium">{slot}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      </div>

      {/* Selected Time Display */}
      {selectedSlot && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-gradient-to-r from-amber-900/70 to-amber-800/70 rounded-lg border border-amber-700/70 shadow-inner backdrop-blur-sm"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <div className="text-center sm:text-left">
              <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Selected Time</h3>
              <p className="text-lg font-bold text-amber-100">{selectedSlot}</p>
            </div>
            <button
              onClick={() => handleOpenDialog(selectedSlot)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg text-white font-medium text-sm shadow transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              Confirm Reservation
            </button>
          </div>
        </motion.div>
      )}

      {/* Custom scrollbar styling */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(180, 83, 9, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(217, 119, 6, 0.4);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}