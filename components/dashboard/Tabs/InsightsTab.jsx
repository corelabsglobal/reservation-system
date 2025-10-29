'use client';

import LuxuryAnalyticsDashboard from '@/app/components/Dashboard/Analytics';
import CustomerSpendAnalytics from '@/app/components/Dashboard/CustomerSpendAnalytics';

const InsightsTab = ({ activeSubTab, restaurant, reservations }) => {
  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'spend':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-100">Customer Spend Analytics</h3>
            <CustomerSpendAnalytics restaurant={restaurant} reservations={reservations} />
          </div>
        );

      case 'performance':
      default:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-100">Business Performance</h3>
            <LuxuryAnalyticsDashboard restaurant={restaurant} reservations={reservations} />
          </div>
        );
    }
  };

  return (
    <div className="mb-6 p-6 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
      <h2 className="text-2xl font-semibold mb-6 text-gray-100 text-white">Business Insights</h2>

      {/* Sub Navigation */}
      <div className="flex gap-2 mb-6">
        {['spend'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-lg capitalize transition-all ${
              activeSubTab === tab 
                ? 'bg-gradient-to-r from-yellow-400 to-pink-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {tab === 'spend' ? 'Spend Analytics' : 'Performance'}
          </button>
        ))}
      </div>

      {renderSubTabContent()}
    </div>
  );
};

export default InsightsTab;