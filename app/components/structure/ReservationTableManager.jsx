'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const ReservationTableManager = ({ restaurant, reservations, tables, tableTypes, onReservationUpdate }) => {
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('upcoming');

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Categorize reservations
  const categorizedReservations = reservations.reduce((acc, res) => {
    if (res.cancelled) return acc;
    
    const reservationDateTime = new Date(`${res.date}T${res.time}`);
    const isPast = reservationDateTime < currentTime;
    
    if (isPast) {
      acc.past.push(res);
    } else {
      acc.upcoming.push(res);
    }
    
    return acc;
  }, { upcoming: [], past: [] });

  // Sort reservations by date and time
  const sortReservations = (reservations) => {
    return [...reservations].sort((a, b) => {
      const aDateTime = new Date(`${a.date}T${a.time}`);
      const bDateTime = new Date(`${b.date}T${b.time}`);
      return aDateTime - bDateTime;
    });
  };

  const sortedUpcomingReservations = sortReservations(categorizedReservations.upcoming);
  const sortedPastReservations = sortReservations(categorizedReservations.past);

  // Get available tables when a reservation is selected
  useEffect(() => {
    if (!selectedReservation || !restaurant) return;

    // Don't fetch tables for past reservations
    const reservationDateTime = new Date(`${selectedReservation.date}T${selectedReservation.time}`);
    if (reservationDateTime < currentTime) {
      setAvailableTables([]);
      return;
    }

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
        // Exclude the current table (if already assigned) from conflicting tables
        const filteredConflictingTableIds = conflictingTableIds.filter(
          tableId => tableId !== selectedReservation.table_id
        );
        
        const trulyAvailableTables = suitableTables.filter(
          table => !filteredConflictingTableIds.includes(table.id)
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
  }, [selectedReservation, restaurant, tables, tableTypes, currentTime]);

  const handleMoveReservation = async (newTableId) => {
    if (!selectedReservation) return;

    // Don't allow moving past reservations
    const reservationDateTime = new Date(`${selectedReservation.date}T${selectedReservation.time}`);
    if (reservationDateTime < currentTime) {
      toast.error('Cannot modify past reservations');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ table_id: newTableId })
        .eq('id', selectedReservation.id);

      if (error) throw error;

      toast.success(`Reservation moved to Table ${tables.find(t => t.id === newTableId)?.table_number}`);
      
      // Call the callback to refresh reservations
      if (onReservationUpdate) {
        onReservationUpdate();
      }
      
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error moving reservation:', error);
      toast.error('Failed to move reservation');
    } finally {
      setLoading(false);
    }
  };

  const isReservationPast = (reservation) => {
    const reservationDateTime = new Date(`${reservation.date}T${reservation.time}`);
    return reservationDateTime < currentTime;
  };

  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
  };

  return (
    <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-yellow-400">Reservation Table Manager</h3>
          <div className="group relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute hidden group-hover:block bottom-full mb-2 w-64 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg z-10">
              Manage table assignments for reservations. Past reservations are shown for reference but cannot be modified.
            </div>
          </div>
        </div>
        
        {/* Tabs for switching between upcoming and past reservations */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upcoming' 
                ? 'bg-yellow-500 text-gray-900' 
                : 'text-gray-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({sortedUpcomingReservations.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'past' 
                ? 'bg-gray-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('past')}
          >
            Past ({sortedPastReservations.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reservations List */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 text-gray-300">
            {activeTab === 'upcoming' ? 'Upcoming Reservations' : 'Past Reservations'}
          </h4>
          
          {activeTab === 'upcoming' && sortedUpcomingReservations.length === 0 ? (
            <p className="text-gray-400 py-4 text-center">No upcoming reservations</p>
          ) : activeTab === 'past' && sortedPastReservations.length === 0 ? (
            <p className="text-gray-400 py-4 text-center">No past reservations</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {(activeTab === 'upcoming' ? sortedUpcomingReservations : sortedPastReservations).map(reservation => {
                const isPast = isReservationPast(reservation);
                
                return (
                  <div 
                    key={reservation.id} 
                    className={`p-3 rounded transition-all ${
                      selectedReservation?.id === reservation.id 
                        ? isPast
                          ? 'bg-gray-600/50 border border-gray-500 cursor-not-allowed'
                          : 'bg-yellow-500/20 border border-yellow-500'
                        : isPast
                          ? 'bg-gray-700/30 cursor-not-allowed opacity-75'
                          : 'bg-gray-700/50 hover:bg-gray-600 cursor-pointer'
                    }`}
                    onClick={() => !isPast && handleReservationClick(reservation)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <p className={`font-medium ${isPast ? 'text-gray-400' : 'text-white'}`}>
                            {reservation.name}
                          </p>
                          {isPast && (
                            <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full">
                              Past
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-300'}`}>
                          {reservation.people} {reservation.people === 1 ? 'person' : 'people'} • {reservation.date} at {reservation.time}
                        </p>
                        {reservation.table_id && (
                          <p className={`text-xs mt-1 ${isPast ? 'text-gray-500' : 'text-gray-400'}`}>
                            Table: {tables.find(t => t.id === reservation.table_id)?.table_number || 'Not assigned'}
                          </p>
                        )}
                      </div>
                      {selectedReservation?.id === reservation.id && !isPast && (
                        <span className="text-yellow-400 ml-2">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Tables */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 text-gray-300">
            {selectedReservation 
              ? isReservationPast(selectedReservation)
                ? 'Past Reservation (View Only)'
                : 'Available Tables' 
              : 'Select a reservation first'}
          </h4>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            </div>
          ) : selectedReservation ? (
            isReservationPast(selectedReservation) ? (
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-center">
                  This is a past reservation and cannot be modified.
                </p>
                {selectedReservation.table_id && (
                  <div className="mt-4 p-3 bg-gray-600/30 rounded">
                    <p className="text-sm text-gray-300">
                      Was assigned to: <span className="font-medium">
                        Table {tables.find(t => t.id === selectedReservation.table_id)?.table_number}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ) : availableTables.length === 0 ? (
              <p className="text-gray-400 py-4 text-center">No available tables for this time slot</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {availableTables.map(table => {
                  const tableType = tableTypes.find(type => type.id === table.table_type_id);
                  return (
                    <div 
                      key={table.id} 
                      className="p-3 rounded bg-gray-700/50 hover:bg-gray-600 transition-all cursor-pointer"
                      onClick={() => handleMoveReservation(table.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium">Table {table.table_number}</p>
                          <p className="text-sm text-gray-300">
                            {tableType?.name} ({tableType?.capacity} seats)
                          </p>
                          {table.position_description && (
                            <p className="text-xs text-gray-400 mt-1">{table.position_description}</p>
                          )}
                        </div>
                        <button className="bg-gradient-to-r from-yellow-400 to-pink-600 px-3 py-1 rounded text-sm whitespace-nowrap">
                          Move Here
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <p className="text-gray-400 py-4 text-center">Select a reservation to see available tables</p>
          )}
        </div>
      </div>

      {selectedReservation && (
        <div className={`mt-4 p-3 rounded-lg ${
          isReservationPast(selectedReservation) 
            ? 'bg-gray-700/50 border border-gray-600' 
            : 'bg-gray-800'
        }`}>
          <p className={`text-sm ${isReservationPast(selectedReservation) ? 'text-gray-400' : 'text-gray-300'}`}>
            {isReservationPast(selectedReservation) ? 'Past reservation for' : 'Moving reservation for'}{' '}
            <span className="font-medium">{selectedReservation.name}</span> ({selectedReservation.people} people) on {selectedReservation.date} at {selectedReservation.time}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReservationTableManager;