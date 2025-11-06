'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { jsPDF } from 'jspdf';
import CustomerUpload from './CustomerExcelUpload';
import EmailMarketing from '../../structure/EmailMarketing';
import ManualCustomerEntry from './CustomerEntry';

const CustomersSection = ({ restaurant, reservations }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (restaurant?.id) {
      fetchCustomers();
    }
  }, [restaurant, refreshTrigger]);

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
          source: c.source || 'upload',
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

  const handleCustomerAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Filter out duplicate emails and apply search
  const filteredCustomers = useMemo(() => {
    let processedCustomers = customers;

    // Filter out duplicates by email (keep the first occurrence)
    const uniqueCustomers = [];
    const emailMap = new Map();

    processedCustomers.forEach(customer => {
      if (customer.email) {
        const normalizedEmail = customer.email.toLowerCase().trim();
        if (!emailMap.has(normalizedEmail)) {
          emailMap.set(normalizedEmail, true);
          uniqueCustomers.push(customer);
        }
      } else {
        // If no email, include the customer
        uniqueCustomers.push(customer);
      }
    });

    // Apply search filter
    if (!searchQuery) return uniqueCustomers;

    return uniqueCustomers.filter(customer => {
      const searchTerm = searchQuery.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.phone?.includes(searchQuery.replace(/\D/g, ''))
      );
    });
  }, [customers, searchQuery]);

  // Pagination
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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
    
    const uniqueCustomers = filteredCustomers.length;
    const reservationCustomers = filteredCustomers.filter(c => c.source === 'reservation').length;
    const uploadedCustomers = filteredCustomers.filter(c => c.source === 'upload').length;
    const repeatCustomers = filteredCustomers.filter(c => c.reservation_count > 1).length;
    
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
    const totalCustomers = filteredCustomers.length;
    const reservationCustomers = filteredCustomers.filter(c => c.source === 'reservation').length;
    const uploadedCustomers = filteredCustomers.filter(c => c.source === 'upload').length;
    const manualCustomers = filteredCustomers.filter(c => c.source === 'manual').length;
    const repeatCustomers = filteredCustomers.filter(c => c.reservation_count > 1).length;
    const newThisMonth = filteredCustomers.filter(c => {
      const created = new Date(c.created_at);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return created > monthAgo;
    }).length;

    return {
      totalCustomers,
      reservationCustomers,
      uploadedCustomers,
      manualCustomers,
      repeatCustomers,
      newThisMonth
    };
  }, [filteredCustomers]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-white">Customers</h2>
            <p className="text-gray-400 text-sm mt-1">
              Manage customers from reservations and uploaded lists
            </p>
          </div>
          
          <button 
            onClick={generateCustomerPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-600 rounded-lg transition-colors w-full sm:w-auto justify-center"
            title="Download customer report"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          <div className="bg-yellow-500/20 px-3 py-2 rounded-full text-yellow-400 text-sm whitespace-nowrap flex-shrink-0">
            Total: {stats.totalCustomers}
          </div>
          <div className="bg-blue-500/20 px-3 py-2 rounded-full text-blue-400 text-sm whitespace-nowrap flex-shrink-0">
            Reservations: {stats.reservationCustomers}
          </div>
          <div className="bg-green-500/20 px-3 py-2 rounded-full text-green-400 text-sm whitespace-nowrap flex-shrink-0">
            Uploaded: {stats.uploadedCustomers}
          </div>
          <div className="bg-purple-500/20 px-3 py-2 rounded-full text-purple-400 text-sm whitespace-nowrap flex-shrink-0">
            Repeat: {stats.repeatCustomers}
          </div>
        </div>
      </div>

      {/* Upload Section */}
        <ManualCustomerEntry 
          restaurantId={restaurant?.id} 
          onCustomerAdded={handleCustomerAdded}
        />
        <CustomerUpload restaurantId={restaurant?.id} />

      {/* Search and Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="text-sm text-gray-400 whitespace-nowrap">
            Showing {paginatedCustomers.length} of {filteredCustomers.length}
          </div>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-gray-700 text-white">
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Visits</th>
              <th className="px-4 py-3 text-left">Last Visit</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                  {searchQuery ? 'No customers found matching your search' : 'No customers found'}
                </td>
              </tr>
            ) : (
              paginatedCustomers
                .sort((a, b) => (b.reservation_count || 0) - (a.reservation_count || 0))
                .map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-all">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{customer.name}</div>
                      {customer.source === 'upload' && (
                        <div className="text-xs text-gray-400">Uploaded customer</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{customer.email || 'No email'}</div>
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
                      <div className="text-center text-white">
                        {customer.reservation_count || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 text-center sm:text-left">
            Page {currentPage} of {totalPages} • {filteredCustomers.length} total customers
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    currentPage === pageNum
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Total Customers</div>
          <div className="text-2xl font-bold text-white">{stats.totalCustomers}</div>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">From Reservations</div>
          <div className="text-2xl font-bold text-white">{stats.reservationCustomers}</div>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">From Uploads</div>
          <div className="text-2xl font-bold text-white">{stats.uploadedCustomers}</div>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Repeat Customers</div>
          <div className="text-2xl font-bold text-white">{stats.repeatCustomers}</div>
        </div>
      </div>

      {/* Email Marketing */}
      <EmailMarketing 
        restaurantId={restaurant?.id} 
        name={restaurant?.name}
        customers={filteredCustomers}
      />
    </div>
  );
};

export default CustomersSection;