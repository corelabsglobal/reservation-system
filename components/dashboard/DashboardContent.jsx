'use client';

import OverviewTab from './Tabs/OverviewTab';
import ReservationsTab from './Tabs/ReservationsTab';
import CustomersTab from './Tabs/CustomersTab';
import InsightsTab from './Tabs/InsightsTab';
import ManageTab from './Tabs/ManageTab';

const DashboardContent = ({ 
  activeTab, 
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
  onReservationUpdate,
  onUpdateRestaurant
}) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab 
            activeSubTab={activeSubTab}
            restaurant={restaurant}
            reservations={reservations}
          />
        );
      
      case 'reservations':
        return (
          <ReservationsTab 
            activeSubTab={activeSubTab}
            restaurant={restaurant}
            reservations={reservations}
            tables={tables}
            tableTypes={tableTypes}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            onMarkAsSeen={onMarkAsSeen}
            onMarkAsAttended={onMarkAsAttended}
            onCancelReservation={onCancelReservation}
            onReservationUpdate={onReservationUpdate}
          />
        );
      
      case 'customers':
        return (
          <CustomersTab 
            activeSubTab={activeSubTab}
            restaurant={restaurant}
            reservations={reservations}
          />
        );
      
      case 'insights':
        return (
          <InsightsTab 
            activeSubTab={activeSubTab}
            restaurant={restaurant}
            reservations={reservations}
          />
        );
      
      case 'manage':
        return (
          <ManageTab 
            activeSubTab={activeSubTab}
            restaurant={restaurant}
            onUpdateRestaurant={onUpdateRestaurant}
            tables={tables}
            tableTypes={tableTypes}
          />
        );
      
      default:
        return <OverviewTab activeSubTab={activeSubTab} restaurant={restaurant} reservations={reservations} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-1 sm:px-4">
      {renderContent()}
    </div>
  );
};

export default DashboardContent;