'use client';

import { useState } from 'react';
import { 
  FiBarChart2, 
  FiCalendar, 
  FiUsers, 
  FiTrendingUp, 
  FiSettings,
  FiChevronDown,
  FiChevronRight,
  FiX,
  FiSidebar
} from 'react-icons/fi';

const Sidebar = ({ activeTab, setActiveTab, activeSubTab, setActiveSubTab }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = {
    overview: {
      label: 'Overview',
      icon: <FiBarChart2 className="text-lg" />,
      subtabs: ['dashboard', 'analytics']
    },
    reservations: {
      label: 'Reservations',
      icon: <FiCalendar className="text-lg" />,
      subtabs: ['current', 'today', 'all']
    },
    customers: {
      label: 'Customers',
      icon: <FiUsers className="text-lg" />,
      subtabs: ['list']
    },
    insights: {
      label: 'Insights',
      icon: <FiTrendingUp className="text-lg" />,
      subtabs: ['spend', 'performance']
    },
    manage: {
      label: 'Manage',
      icon: <FiSettings className="text-lg" />,
      subtabs: ['restaurant', 'tables', 'pricing', 'settings']
    }
  };

  const handleTabClick = (key, item) => {
    setActiveTab(key);
    setActiveSubTab(item.subtabs[0]);
    // Close mobile sidebar when a tab is clicked
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  const handleSubTabClick = (subtab) => {
    setActiveSubTab(subtab);
    // Close mobile sidebar when a subtab is clicked
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Dashboard Menu Button - Only show when sidebar is closed on mobile */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden fixed top-20 left-4 z-50 p-3 bg-gradient-to-r from-yellow-400 to-pink-600 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
          aria-label="Open Dashboard Menu"
        >
          <FiSidebar className="text-xl" />
          {/* Tooltip */}
          <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Dashboard Menu
          </div>
        </button>
      )}

      {/* Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-70 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-40 w-64 bg-gray-900/95 backdrop-blur-md min-h-screen border-r border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        shadow-2xl md:shadow-none
      `}>
        {/* Close Button - Mobile Only */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          aria-label="Close Dashboard Menu"
        >
          <FiX className="text-xl" />
        </button>

        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiSidebar className="text-yellow-400" />
            Dashboard
          </h2>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
          {Object.entries(menuItems).map(([key, item]) => (
            <div key={key} className="space-y-1">
              {/* Main Tab */}
              <button
                onClick={() => handleTabClick(key, item)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === key 
                    ? 'bg-gradient-to-r from-yellow-400 to-pink-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${activeTab === key ? 'text-white' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </div>
                {activeTab === key ? (
                  <FiChevronDown className="text-sm" />
                ) : (
                  <FiChevronRight className="text-sm" />
                )}
              </button>

              {/* Sub Tabs */}
              {activeTab === key && (
                <div className="ml-4 space-y-1 animate-fadeIn">
                  {item.subtabs.map((subtab) => (
                    <button
                      key={subtab}
                      onClick={() => handleSubTabClick(subtab)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded text-sm transition-all ${
                        activeSubTab === subtab
                          ? 'bg-gray-800 text-yellow-400 shadow-inner'
                          : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
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
    </>
  );
};

export default Sidebar;