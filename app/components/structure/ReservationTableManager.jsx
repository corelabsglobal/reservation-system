'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const ReservationTableManager = ({ restaurant, reservations, tables, tableTypes }) => {
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter reservations to only show upcoming ones (not past)
  const upcomingReservations = reservations.filter(res => {
    const reservationDateTime = new Date(`${res.date}T${res.time}`);
    return reservationDateTime >= currentTime && !res.cancelled;
  });

  // Get available tables when a reservation is selected
  useEffect(() => {
    if (!selectedReservation || !restaurant) return;

    const fetchAvailableTables = async () => {
      setLoading(true);
      try {
        // Get tables that can accommodate the reservation's party size
        const suitableTables = tables.filter(table => {
          const tableType = tableTypes.find(type => type.id === table.table_type_id);
          return tableType && tableType.capacity >= selectedReservation.people;
        });

        // Check which of these tables are available at the reservation time
        const { data: conflictingReservations, error } = await supabase
          .from('reservations')
          .select('table_id')
          .eq('restaurant_id', restaurant.id)
          .eq('date', selectedReservation.date)
          .eq('time', selectedReservation.time)
          .eq('cancelled', false);

        if (error) throw error;

        const conflictingTableIds = conflictingReservations.map(res => res.table_id);
        const trulyAvailableTables = suitableTables.filter(
          table => !conflictingTableIds.includes(table.id)
        );

        setAvailableTables(trulyAvailableTables);
      } catch (error) {
        console.error('Error fetching available tables:', error);
        toast.error('Failed to load available tables');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableTables();
  }, [selectedReservation, restaurant, tables, tableTypes]);

  const handleMoveReservation = async (newTableId) => {
    if (!selectedReservation) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ table_id: newTableId })
        .eq('id', selectedReservation.id);

      if (error) throw error;

      toast.success(`Reservation moved to Table ${tables.find(t => t.id === newTableId)?.table_number}`);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error moving reservation:', error);
      toast.error('Failed to move reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-bold text-yellow-400">Reservation Table Manager</h3>
        <div className="group relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute hidden group-hover:block bottom-full mb-2 w-64 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg">
            Move upcoming reservations to different available tables. Select a reservation first, then choose from available tables.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reservations List */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 text-gray-300">Upcoming Reservations</h4>
          {upcomingReservations.length === 0 ? (
            <p className="text-gray-400">No upcoming reservations</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {upcomingReservations.map(reservation => (
                <div 
                  key={reservation.id} 
                  className={`p-3 rounded cursor-pointer transition-all ${selectedReservation?.id === reservation.id ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-gray-700/50 hover:bg-gray-600'}`}
                  onClick={() => setSelectedReservation(reservation)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{reservation.name}</p>
                      <p className="text-sm text-gray-300">
                        {reservation.people} {reservation.people === 1 ? 'person' : 'people'} • {reservation.date} at {reservation.time}
                      </p>
                      {reservation.table_id && (
                        <p className="text-xs text-gray-400 mt-1">
                          Current table: {tables.find(t => t.id === reservation.table_id)?.table_number || 'Not assigned'}
                        </p>
                      )}
                    </div>
                    {selectedReservation?.id === reservation.id && (
                      <span className="text-yellow-400">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Tables */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 text-gray-300">
            {selectedReservation ? 'Available Tables' : 'Select a reservation first'}
          </h4>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            </div>
          ) : selectedReservation ? (
            availableTables.length === 0 ? (
              <p className="text-gray-400">No available tables for this time slot</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {availableTables.map(table => {
                  const tableType = tableTypes.find(type => type.id === table.table_type_id);
                  return (
                    <div 
                      key={table.id} 
                      className="p-3 rounded bg-gray-700/50 hover:bg-gray-600 transition-all cursor-pointer"
                      onClick={() => handleMoveReservation(table.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Table {table.table_number}</p>
                          <p className="text-sm text-gray-300">
                            {tableType?.name} ({tableType?.capacity} seats)
                          </p>
                          {table.position_description && (
                            <p className="text-xs text-gray-400 mt-1">{table.position_description}</p>
                          )}
                        </div>
                        <button className="bg-gradient-to-r from-yellow-400 to-pink-600 px-3 py-1 rounded text-sm">
                          Move Here
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <p className="text-gray-400">Select a reservation from the left to see available tables</p>
          )}
        </div>
      </div>

      {selectedReservation && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-300">
            Moving reservation for <span className="font-medium">{selectedReservation.name}</span> ({selectedReservation.people} people) on {selectedReservation.date} at {selectedReservation.time}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReservationTableManager;