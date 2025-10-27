'use client';

const Sidebar = ({ activeTab, setActiveTab, activeSubTab, setActiveSubTab }) => {
  const menuItems = {
    overview: {
      label: 'Overview',
      icon: '📊',
      subtabs: ['dashboard', 'analytics']
    },
    reservations: {
      label: 'Reservations',
      icon: '📅',
      subtabs: ['current', 'today', 'all']
    },
    customers: {
      label: 'Customers',
      icon: '👥',
      subtabs: ['list', 'analytics']
    },
    insights: {
      label: 'Insights',
      icon: '📈',
      subtabs: ['spend', 'performance']
    },
    manage: {
      label: 'Manage',
      icon: '⚙️',
      subtabs: ['restaurant', 'tables', 'pricing', 'settings']
    }
  };

  return (
    <div className="relative z-20 w-64 bg-gray-900/95 backdrop-blur-md min-h-screen border-r border-gray-700">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {Object.entries(menuItems).map(([key, item]) => (
          <div key={key} className="space-y-1">
            {/* Main Tab */}
            <button
              onClick={() => {
                setActiveTab(key);
                setActiveSubTab(item.subtabs[0]);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === key 
                  ? 'bg-gradient-to-r from-yellow-400 to-pink-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>

            {/* Sub Tabs */}
            {activeTab === key && (
              <div className="ml-8 space-y-1">
                {item.subtabs.map((subtab) => (
                  <button
                    key={subtab}
                    onClick={() => setActiveSubTab(subtab)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-all ${
                      activeSubTab === subtab
                        ? 'bg-gray-800 text-yellow-400'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                    {subtab.charAt(0).toUpperCase() + subtab.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;