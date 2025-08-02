'use client';

import { useState } from "react";
import toast from "react-hot-toast";

export default function DateSelector({ 
  selectedDate, 
  setSelectedDate, 
  isDateClosed
}) {
  const [localDate, setLocalDate] = useState(selectedDate);

  const handleDateChange = (e) => {
    const selected = e.target.value;
    const today = new Date().toISOString().split("T")[0];
    
    if (selected < today) {
      setLocalDate(today);
      setSelectedDate(today);
      toast.error("Cannot select a date in the past", { id: 'past-date' });
      return;
    }

    if (!isDateClosed(selected)) {
      setLocalDate(selected);
      setSelectedDate(selected);
    } else {
      toast.error("The restaurant is closed on this day", { id: 'closed-date' });
    }
  };

  return (
    <div className="mt-4">
      <label className="text-yellow-400 font-semibold">Select Date:</label>
      {isDateClosed(selectedDate) && (
        <div className="text-red-400 text-sm mb-1">
          The restaurant is closed on this day
        </div>
      )}
      <input
        type="date"
        value={localDate}
        onChange={handleDateChange}
        className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400 w-full mt-2"
        min={new Date().toISOString().split("T")[0]}
        onFocus={(e) => {
          e.target.showPicker();
        }}
      />
    </div>
  );
}