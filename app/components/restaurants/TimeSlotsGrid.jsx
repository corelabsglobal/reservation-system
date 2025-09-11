'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TimeSlotsSelect({ 
  availableSlots, 
  handleOpenDialog,
  fallbackMode,
  restaurant
}) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const slotsContainerRef = useRef(null);

  const handleSelect = (slot) => {
    setSelectedSlot(slot);
    setIsDropdownOpen(false);
  };

  const handleConfirm = () => {
    if (selectedSlot) {
      handleOpenDialog(selectedSlot);
    }
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
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Available Reservations</h2>
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                {fallbackMode 
                  ? "No available slots for selected date. Please contact the restaurant directly at " + restaurant.phone
                  : "No available slots for selected date/party size. Please contact the restaurant directly at " + restaurant.phone}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4" ref={slotsContainerRef}>
      <h2 className="text-xl font-semibold text-gray-800 mb-3">Select a Time</h2>
      
      {/* Elegant Grid View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {availableSlots.map((slot) => (
          <motion.button
            key={slot}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(slot)}
            className={`py-3 px-3 rounded-lg border transition-all duration-200 flex items-center justify-center ${
              selectedSlot === slot
                ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-amber-50 hover:border-amber-300'
            }`}
          >
            <span className="font-medium text-sm sm:text-base">{slot}</span>
            {selectedSlot === slot && (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 text-white ml-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </motion.button>
        ))}
      </div>

      {/* Alternative Compact Selector (hidden by default) */}
      <div className="hidden">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm flex justify-between items-center transition-all duration-200 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
          >
            <span className="text-gray-700 text-sm font-medium truncate">
              {selectedSlot || "Select time"}
            </span>
            <motion.span
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              className="text-gray-500 ml-2"
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
                className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
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
                      whileHover={{ backgroundColor: '#FFFBEB' }}
                      className="px-3 py-2 cursor-pointer transition-colors duration-150 hover:bg-amber-50 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSelect(slot)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 text-sm font-medium">{slot}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="text-center sm:text-left">
              <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Selected Time</h3>
              <p className="text-lg font-bold text-amber-900">{selectedSlot}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-white font-medium text-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              Confirm Reservation
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Custom scrollbar styling */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(254, 243, 199, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(245, 158, 11, 0.5);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}