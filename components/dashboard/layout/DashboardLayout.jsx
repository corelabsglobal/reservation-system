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
    <div className="relative min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/images/background.jpeg')" }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      
      {/* Main layout container */}
      <div className="relative z-10 flex min-h-screen">
        {/* Mobile Sidebar */}
        <div className="md:hidden">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
            mobile={true}
          />
        </div>
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <div className="fixed top-0 left-0 h-screen z-20">
            <Sidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              mobile={false}
            />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen md:ml-64">
          {/* Header */}
          <div className="fixed top-0 left-0 right-0 z-10 md:left-64">
            <Header />
          </div>
          
          {/* Main content scroll area */}
          <div className="flex-1 flex flex-col pt-16 md:pt-20 overflow-auto">
            {/* Subscription Manager */}
            {restaurant && (
              <div className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4">
                <SubscriptionManager restaurant={restaurant} />
              </div>
            )}
            
            {/* Page Title */}
            <div className="text-center mt-3 sm:mt-4 px-3 sm:px-4 md:px-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-600 drop-shadow-lg mb-3 sm:mb-4">
                Dashboard
              </h1>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 p-3 sm:p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;