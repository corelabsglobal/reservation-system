'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import CustomerUpload from './CustomerExcelUpload';
import EmailMarketing from '../../structure/EmailMarketing';

const CustomersSection = ({ restaurant, reservations }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (restaurant?.id) {
      fetchCustomers();
    }
  }, [restaurant]);

  const fetchCustomers = async () => {
    if (!restaurant?.id) return;

    setLoading(true);
    try {
      // Fetch uploaded customers
      const { data: uploadedCustomers, error: uploadError } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (uploadError) throw uploadError;

      // Combine with reservation customers (avoiding duplicates by email/phone)
      const reservationCustomers = reservations.reduce((acc, res) => {
        const customerKey = `${res.email}-${res.number}`;
        if (!acc[customerKey] && (res.email || res.number)) {
          acc[customerKey] = {
            id: `res-${res.id}`,
            name: res.name,
            email: res.email,
            phone: res.number ? `0${res.number}` : '',
            source: 'reservation',
            reservation_count: 1,
            last_visit: res.date,
            created_at: res.created_at
          };
        } else if (acc[customerKey]) {
          acc[customerKey].reservation_count++;
          if (new Date(res.date) > new Date(acc[customerKey].last_visit)) {
            acc[customerKey].last_visit = res.date;
          }
        }
        return acc;
      }, {});

      const allCustomers = [
        ...Object.values(reservationCustomers),
        ...(uploadedCustomers || []).map(c => ({
          ...c,
          source: 'upload',
          reservation_count: 0
        }))
      ];

      setCustomers(allCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;

    return customers.filter(customer => {
      const searchTerm = searchQuery.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.phone?.includes(searchQuery.replace(/\D/g, ''))
      );
    });
  }, [customers, searchQuery]);

  const generateCustomerPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(`${restaurant?.name || 'Restaurant'} Customer Report`, 15, 15);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 25);
    
    // Add summary statistics
    doc.setFontSize(14);
    doc.text('Summary Statistics', 15, 35);
    
    const uniqueCustomers = customers.length;
    const reservationCustomers = customers.filter(c => c.source === 'reservation').length;
    const uploadedCustomers = customers.filter(c => c.source === 'upload').length;
    const repeatCustomers = customers.filter(c => c.reservation_count > 1).length;
    
    doc.setFontSize(12);
    doc.text(`Total Customers: ${uniqueCustomers}`, 15, 45);
    doc.text(`From Reservations: ${reservationCustomers}`, 15, 55);
    doc.text(`From Uploads: ${uploadedCustomers}`, 15, 65);
    doc.text(`Repeat Customers: ${repeatCustomers}`, 15, 75);
    
    // Add customer table header
    doc.setFontSize(14);
    doc.text('Customer Details', 15, 95);
    
    // Add table headers
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Name', 15, 105);
    doc.text('Contact', 60, 105);
    doc.text('Source', 110, 105);
    doc.text('Visits', 150, 105);
    doc.text('Last Visit', 180, 105);
    doc.setFont(undefined, 'normal');
    
    // Add customer rows
    let yPosition = 115;
    filteredCustomers
      .sort((a, b) => (b.reservation_count || 0) - (a.reservation_count || 0))
      .forEach((customer, index) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(customer.name || 'N/A', 15, yPosition);
        doc.text(
          [customer.email, customer.phone].filter(Boolean).join(' / '), 
          60, 
          yPosition
        );
        doc.text(
          customer.source === 'reservation' ? 'Reservation' : 'Upload', 
          110, 
          yPosition
        );
        doc.text(
          (customer.reservation_count || 0).toString(), 
          150, 
          yPosition
        );
        
        if (customer.last_visit) {
          doc.text(
            new Date(customer.last_visit).toLocaleDateString(), 
            180, 
            yPosition
          );
        }
        
        yPosition += 10;
      });
    
    doc.save(`${restaurant?.name || 'restaurant'}_customers_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const reservationCustomers = customers.filter(c => c.source === 'reservation').length;
    const uploadedCustomers = customers.filter(c => c.source === 'upload').length;
    const repeatCustomers = customers.filter(c => c.reservation_count > 1).length;
    const newThisMonth = customers.filter(c => {
      const created = new Date(c.created_at);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return created > monthAgo;
    }).length;

    return {
      totalCustomers,
      reservationCustomers,
      uploadedCustomers,
      repeatCustomers,
      newThisMonth
    };
  }, [customers]);

  if (loading) {
    return (
      <div className="mb-6 p-4 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
        <div className="flex justify-center items-center h-32">
          <div className="text-white">Loading customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Customers</h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage customers from reservations and uploaded lists
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-400 text-sm">
            Total: {stats.totalCustomers}
          </div>
          <div className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-sm">
            Reservations: {stats.reservationCustomers}
          </div>
          <div className="bg-green-500/20 px-3 py-1 rounded-full text-green-400 text-sm">
            Uploaded: {stats.uploadedCustomers}
          </div>
          <button 
            onClick={generateCustomerPDF}
            className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Download customer report"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <CustomerUpload restaurantId={restaurant?.id} />

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-gray-700">
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Visits</th>
              <th className="px-4 py-3 text-left">Last Visit</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                  {searchQuery ? 'No customers found matching your search' : 'No customers found'}
                </td>
              </tr>
            ) : (
              filteredCustomers
                .sort((a, b) => (b.reservation_count || 0) - (a.reservation_count || 0))
                .map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-all">
                    <td className="px-4 py-3">
                      <div className="font-medium">{customer.name}</div>
                      {customer.source === 'upload' && (
                        <div className="text-xs text-gray-400">Uploaded customer</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{customer.email || 'No email'}</div>
                      <div className="text-xs text-gray-400">{customer.phone || 'No phone'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        customer.source === 'reservation' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {customer.source === 'reservation' ? 'Reservation' : 'Upload'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-center">
                        {customer.reservation_count || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {customer.last_visit ? (
                        <>
                          <div>{new Date(customer.last_visit).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">
                            {customer.source === 'reservation' ? 'Reserved' : 'Added'}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {customer.reservation_count > 1 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            Regular
                          </span>
                        </div>
                      ) : customer.source === 'reservation' ? (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                          New
                        </span>
                      ) : (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          Uploaded
                        </span>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Total Customers</div>
          <div className="text-2xl font-bold">{stats.totalCustomers}</div>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">From Reservations</div>
          <div className="text-2xl font-bold">{stats.reservationCustomers}</div>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">From Uploads</div>
          <div className="text-2xl font-bold">{stats.uploadedCustomers}</div>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Repeat Customers</div>
          <div className="text-2xl font-bold">{stats.repeatCustomers}</div>
        </div>
      </div>

      {/* Email Marketing */}
      <EmailMarketing 
        restaurantId={restaurant?.id} 
        name={restaurant?.name}
        customers={customers}
      />
    </div>
  );
};

export default CustomersSection;