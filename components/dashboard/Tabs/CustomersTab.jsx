'use client';

import { jsPDF } from "jspdf";
import CustomersSection from "@/app/components/Dashboard/customers/CustomersTab";

const CustomersTab = ({ activeSubTab, restaurant, reservations }) => {
  const generateCustomerPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(`${restaurant?.name || 'Restaurant'} Customer Report`, 15, 15);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 25);
    
    doc.setFontSize(14);
    doc.text('Summary Statistics', 15, 35);
    
    const uniqueCustomers = Array.from(new Set(reservations.map(res => res.email))).length;
    const repeatCustomers = Object.values(reservations.reduce((acc, res) => {
      acc[res.email] = (acc[res.email] || 0) + 1;
      return acc;
    }, {})).filter(count => count > 1).length;
    const newThisMonth = Array.from(new Set(reservations
      .filter(res => new Date(res.date) > new Date(new Date().setDate(new Date().getDate() - 30)))
      .map(res => res.email)
    )).length;
    
    doc.setFontSize(12);
    doc.text(`Total Unique Customers: ${uniqueCustomers}`, 15, 45);
    doc.text(`Repeat Customers: ${repeatCustomers}`, 15, 55);
    doc.text(`New Customers This Month: ${newThisMonth}`, 15, 65);
    
    // Add customer table header
    doc.setFontSize(14);
    doc.text('Customer Details', 15, 80);
    
    const customerData = Object.entries(
      reservations.reduce((acc, res) => {
        if (!acc[res.email]) {
          acc[res.email] = {
            name: res.name,
            email: res.email,
            phone: res.number ? `0${res.number}` : 'N/A',
            reservationCount: 0,
            lastVisit: '',
            reservations: []
          };
        }
        acc[res.email].reservationCount++;
        acc[res.email].reservations.push(res);
        return acc;
      }, {})
    )
    .sort(([,a], [,b]) => b.reservationCount - a.reservationCount);
    
    // Add table headers
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Name', 15, 90);
    doc.text('Email', 60, 90);
    doc.text('Phone', 110, 90);
    doc.text('Visits', 150, 90);
    doc.text('Last Visit', 180, 90);
    doc.setFont(undefined, 'normal');
    
    // Add customer rows
    let yPosition = 100;
    customerData.forEach(([email, customer], index) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      
      const lastReservation = customer.reservations
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
      doc.text(customer.name, 15, yPosition);
      doc.text(customer.email, 60, yPosition);
      doc.text(customer.phone, 110, yPosition);
      doc.text(customer.reservationCount.toString(), 150, yPosition);
      
      if (lastReservation) {
        doc.text(
          `${new Date(lastReservation.date).toLocaleDateString()} ${lastReservation.time}`,
          180,
          yPosition
        );
      }
      
      yPosition += 10;
    });
    
    doc.save(`${restaurant?.name || 'restaurant'}_customers_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="mb-6 p-6 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Customers</h2>
        <button
          onClick={generateCustomerPDF}
          className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded-lg hover:opacity-80 transition-all font-semibold"
        >
          Export PDF
        </button>
      </div>

      {/* Sub Navigation */}
      <div className="flex gap-2 mb-6">
        {['list'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-lg capitalize transition-all ${
              activeSubTab === tab 
                ? 'bg-gradient-to-r from-yellow-400 to-pink-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {tab === 'list' ? 'Customer List' : 'Customer Analytics'}
          </button>
        ))}
      </div>

      <CustomersSection 
        restaurant={restaurant} 
        reservations={reservations} 
      />
    </div>
  );
};

export default CustomersTab;