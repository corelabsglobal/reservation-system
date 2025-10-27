'use client';

import Sidebar from './Sidebar';
import Header from '@/app/components/structure/header';
import SubscriptionManager from '@/app/components/structure/hooks/SubscriptionManager';

const DashboardLayout = ({ 
  children, 
  restaurant, 
  activeTab, 
  setActiveTab,
  activeSubTab,
  setActiveSubTab 
}) => {
  return (
    <div className="relative min-h-screen bg-cover bg-center bg-fixed flex" style={{ backgroundImage: "url('/images/background.jpeg')" }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
      />
      
      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen mt-20">
        <Header />
        
        {/* Subscription Manager */}
        {restaurant && (
          <div className="px-6 pt-4">
            <SubscriptionManager restaurant={restaurant} />
          </div>
        )}
        
        {/* Page Title */}
        <div className="text-center mt-4 px-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-600 drop-shadow-lg mb-4">
            Dashboard
          </h1>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;