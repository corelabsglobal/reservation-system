'use client';

import { useState, useMemo } from 'react';
import ReservationCard from '@/app/components/structure/ReservationCard';

const ReservationsTab = ({ 
  activeSubTab,
  restaurant,
  reservations,
  tables,
  tableTypes,
  searchQuery,
  setSearchQuery,
  filterDate,
  setFilterDate,
  onMarkAsSeen,
  onMarkAsAttended,
  onCancelReservation,
  onReservationUpdate
}) => {
  const [showAllReservations, setShowAllReservations] = useState(false);

  const filteredReservations = reservations.filter(res => {
    const normalizePhone = (phone) => {
      if (!phone && phone !== 0) return '';
      const phoneStr = typeof phone === 'number' ? phone.toString() : String(phone);
      const digitsOnly = phoneStr.replace(/[^\d]/g, '');
      
      if (digitsOnly.startsWith('233')) {
        return '0' + digitsOnly.substring(3);
      } else if (digitsOnly.startsWith('+233')) {
        return '0' + digitsOnly.substring(4);
      } else if (!digitsOnly.startsWith('0') && digitsOnly.length === 9) {
        return '0' + digitsOnly;
      }
      return digitsOnly;
    };

    const searchTerm = searchQuery.toLowerCase().trim();
    const normalizedPhone = normalizePhone(res.number);
    const searchDigits = searchQuery.replace(/[^\d]/g, '');
    
    if (!searchTerm) {
      if (filterDate) {
        const reservationDateFormatted = new Date(res.date).toISOString().split('T')[0];
        const filterDateFormatted = new Date(filterDate).toISOString().split('T')[0];
        return reservationDateFormatted === filterDateFormatted;
      }
      return true;
    }
    
    const matchesSearch = 
      res.name.toLowerCase().includes(searchTerm) ||
      normalizedPhone.includes(searchDigits);
    
    if (filterDate) {
      const reservationDateFormatted = new Date(res.date).toISOString().split('T')[0];
      const filterDateFormatted = new Date(filterDate).toISOString().split('T')[0];
      return matchesSearch && reservationDateFormatted === filterDateFormatted;
    }
    
    return matchesSearch;
  });

  const currentReservations = useMemo(() => {
    return filteredReservations.filter(res => {
      const reservationTime = new Date(`${res.date}T${res.time}`);
      const now = new Date();
      const fifteenMinutesBefore = new Date(now.getTime() + 15 * 60000);
      return reservationTime <= fifteenMinutesBefore && 
             reservationTime >= new Date(now.getTime() - 2 * 3600000);
    });
  }, [filteredReservations]);
  
  const todaysReservations = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return filteredReservations.filter(res => res.date === today);
  }, [filteredReservations]);

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'current':
        return (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Current Reservations
              <span className="text-sm bg-green-900/50 text-green-400 px-2 py-1 rounded-full ml-2">
                {currentReservations.length} active
              </span>
            </h3>
            
            {currentReservations.length === 0 ? (
              <div className="p-6 bg-gray-700/50 rounded-xl text-center text-gray-400">
                No current reservations at this time
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentReservations.map((res) => (
                  <ReservationCard 
                    key={res.id} 
                    res={res} 
                    markAsSeen={onMarkAsSeen}
                    markAsAttended={onMarkAsAttended}
                    cancelReservation={onCancelReservation}
                    restaurant={restaurant}
                    highlightCurrent
                    tables={tables}
                    tableTypes={tableTypes}
                    onReservationUpdate={onReservationUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'today':
        return (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Today's Reservations
              <span className="text-sm bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded-full ml-2">
                {todaysReservations.length} total
              </span>
            </h3>
            
            {todaysReservations.length === 0 ? (
              <div className="p-6 bg-gray-700/50 rounded-xl text-center text-gray-400">
                No reservations for today
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-600"></div>
                  
                  {todaysReservations.map((res, index) => {
                    const reservationTime = new Date(`${res.date}T${res.time}`);
                    const isPast = reservationTime < new Date();
                    
                    return (
                      <div key={res.id} className="relative pl-10 pb-4">
                        <div className={`absolute left-4 top-4 w-3 h-3 rounded-full ${isPast ? 'bg-gray-500' : 'bg-yellow-400'} transform -translate-x-1/2 z-10`}></div>
                        
                        <ReservationCard 
                          res={res} 
                          markAsSeen={onMarkAsSeen}
                          markAsAttended={onMarkAsAttended}
                          cancelReservation={onCancelReservation}
                          isPast={isPast}
                          restaurant={restaurant}
                          tables={tables}
                          tableTypes={tableTypes}
                          onReservationUpdate={onReservationUpdate}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case 'all':
      default:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              All Reservations
              <span className="text-sm bg-blue-900/50 text-blue-400 px-2 py-1 rounded-full ml-2">
                {filteredReservations.length} total
              </span>
            </h3>

            {filteredReservations.length === 0 ? (
              <div className="p-6 bg-gray-700/50 rounded-xl text-center text-gray-400">
                No reservations found {filterDate ? `on ${new Date(filterDate).toLocaleDateString()}` : ''}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReservations.slice(0, showAllReservations ? filteredReservations.length : 10).map((res) => (
                  <ReservationCard 
                    key={res.id} 
                    res={res} 
                    markAsSeen={onMarkAsSeen}
                    markAsAttended={onMarkAsAttended}
                    cancelReservation={onCancelReservation}
                    restaurant={restaurant}
                    tables={tables}
                    tableTypes={tableTypes}
                    onReservationUpdate={onReservationUpdate}
                  />
                ))}

                {filteredReservations.length > 10 && (
                  <button
                    onClick={() => setShowAllReservations(!showAllReservations)}
                    className="mt-4 w-full bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-3 rounded-lg hover:opacity-80 transition-all font-semibold"
                  >
                    {showAllReservations ? 'Show Less' : `Show All (${filteredReservations.length})`}
                  </button>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="mb-6 p-6 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-white">Reservations</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFilterDate('');
              setSearchQuery('');
            }}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-all"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Enhanced Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by Name or Phone Number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-10 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-400 appearance-none"
          />
        </div>
      </div>

      {renderSubTabContent()}
    </div>
  );
};

export default ReservationsTab;