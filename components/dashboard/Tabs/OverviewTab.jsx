'use client';

import CopyArea from '@/app/components/structure/CopyArea';
import LuxuryAnalyticsDashboard from '@/app/components/Dashboard/Analytics';

const OverviewTab = ({ activeSubTab, restaurant, reservations }) => {
  return (
    <div className="space-y-6">
      {/* URL Copy Area */}
      {restaurant?.url && (
        <div className="mb-6">
          <CopyArea restaurantUrl={restaurant.url} />
        </div>
      )}

      {/* Sub Navigation */}
      <div className="flex gap-2 mb-6">
        {['dashboard', 'analytics'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-lg capitalize transition-all ${
              activeSubTab === tab 
                ? 'bg-gradient-to-r from-yellow-400 to-pink-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {tab === 'dashboard' ? 'Quick View' : 'Detailed Analytics'}
          </button>
        ))}
      </div>

      {/* Content based on sub tab */}
      {activeSubTab === 'dashboard' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Quick Stats Cards */}
          <div className="bg-gray-800/90 backdrop-blur-md rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Total Reservations</h3>
            <p className="text-3xl font-bold text-white">{reservations.length}</p>
          </div>
          
          <div className="bg-gray-800/90 backdrop-blur-md rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Today's Reservations</h3>
            <p className="text-3xl font-bold text-white">
              {reservations.filter(res => res.date === new Date().toISOString().split('T')[0]).length}
            </p>
          </div>
          
          <div className="bg-gray-800/90 backdrop-blur-md rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Current Reservations</h3>
            <p className="text-3xl font-bold text-white">
              {reservations.filter(res => {
                const reservationTime = new Date(`${res.date}T${res.time}`);
                const now = new Date();
                const fifteenMinutesBefore = new Date(now.getTime() + 15 * 60000);
                return reservationTime <= fifteenMinutesBefore && 
                       reservationTime >= new Date(now.getTime() - 2 * 3600000);
              }).length}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800/90 backdrop-blur-md rounded-xl p-6 shadow-2xl">
          <LuxuryAnalyticsDashboard restaurant={restaurant} reservations={reservations} />
        </div>
      )}
    </div>
  );
};

export default OverviewTab;