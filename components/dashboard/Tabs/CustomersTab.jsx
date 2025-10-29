'use client';

import CustomersSection from "@/app/components/Dashboard/customers/CustomersTab";

const CustomersTab = ({ activeSubTab, restaurant, reservations }) => {

  return (
    <div>
      <CustomersSection 
        restaurant={restaurant} 
        reservations={reservations} 
      />
    </div>
  );
};

export default CustomersTab;