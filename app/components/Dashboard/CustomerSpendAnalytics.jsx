'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const CustomerSpendAnalytics = ({ restaurant, reservations }) => {
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('month');
  const [customerDetails, setCustomerDetails] = useState(null);
  const [spendData, setSpendData] = useState([]);

  // Process reservations to get spend analytics
  useEffect(() => {
    if (!reservations || !restaurant) return;

    setLoading(true);

    // Process customer spend data
    const customerSpend = reservations.reduce((acc, res) => {
      if (!acc[res.email]) {
        acc[res.email] = {
          name: res.name,
          email: res.email,
          phone: res.number ? `0${res.number}` : 'N/A',
          totalSpend: 0,
          visits: 0,
          lastVisit: '',
          reservations: []
        };
      }
      
      // Calculate spend (using booking cost or any other metric)
      const spend = restaurant.booking_cost || 0;
      
      acc[res.email].totalSpend += spend;
      acc[res.email].visits++;
      acc[res.email].reservations.push(res);
      acc[res.email].lastVisit = res.date > (acc[res.email].lastVisit || '') ? res.date : acc[res.email].lastVisit;
      
      return acc;
    }, {});

    // Convert to array and sort by spend
    const sortedCustomers = Object.values(customerSpend)
      .sort((a, b) => b.totalSpend - a.totalSpend);

    setCustomerDetails(sortedCustomers);

    // Prepare data for charts
    const now = new Date();
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(now.getFullYear(), i, 1).toLocaleString('default', { month: 'short' });
      return { month, revenue: 0 };
    });

    reservations.forEach(res => {
      const month = new Date(res.date).getMonth();
      const spend = restaurant.booking_cost || 0;
      monthlyData[month].revenue += spend;
    });

    // Weekly data for current month
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const weeksInMonth = Math.ceil(daysInMonth / 7);
    
    const weeklyData = Array.from({ length: weeksInMonth }, (_, i) => {
      const startDay = i * 7 + 1;
      const endDay = Math.min(startDay + 6, daysInMonth);
      return { 
        week: `Week ${i + 1} (${startDay}-${endDay})`, 
        revenue: 0 
      };
    });

    reservations
      .filter(res => {
        const resDate = new Date(res.date);
        return resDate.getMonth() === currentMonth && resDate.getFullYear() === currentYear;
      })
      .forEach(res => {
        const day = new Date(res.date).getDate();
        const weekIndex = Math.floor((day - 1) / 7);
        const spend = restaurant.booking_cost || 0;
        weeklyData[weekIndex].revenue += spend;
      });

    setSpendData({
      monthly: monthlyData,
      weekly: weeklyData,
      topCustomers: sortedCustomers.slice(0, 6)
    });

    setLoading(false);
  }, [reservations, restaurant]);

  const generateSpendReport = () => {
    if (!customerDetails || !restaurant) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(`${restaurant.name} Customer Spend Report`, 15, 15);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 25);
    
    // Summary statistics
    doc.setFontSize(14);
    doc.text('Revenue Summary', 15, 35);
    
    const totalRevenue = customerDetails.reduce((sum, customer) => sum + customer.totalSpend, 0);
    const avgRevenuePerCustomer = customerDetails.length > 0 ? totalRevenue / customerDetails.length : 0;
    const top5CustomersRevenue = customerDetails.slice(0, 5).reduce((sum, customer) => sum + customer.totalSpend, 0);
    const top5Percentage = totalRevenue > 0 ? (top5CustomersRevenue / totalRevenue * 100).toFixed(1) : 0;
    
    doc.setFontSize(12);
    doc.text(`Total Revenue: GHS ${totalRevenue.toFixed(2)}`, 15, 45);
    doc.text(`Average per Customer: GHS ${avgRevenuePerCustomer.toFixed(2)}`, 15, 55);
    doc.text(`Top 5 Customers Contribution: ${top5Percentage}%`, 15, 65);
    
    // Top customers table
    doc.setFontSize(14);
    doc.text('Top Spending Customers', 15, 80);
    
    // Table headers
    doc.setFont(undefined, 'bold');
    doc.text('Name', 15, 90);
    doc.text('Email', 60, 90);
    doc.text('Visits', 110, 90);
    doc.text('Total Spend', 150, 90);
    doc.text('Avg/Visit', 180, 90);
    doc.setFont(undefined, 'normal');
    
    // Customer rows
    let yPosition = 100;
    customerDetails.slice(0, 10).forEach(customer => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(customer.name, 15, yPosition);
      doc.text(customer.email, 60, yPosition);
      doc.text(customer.visits.toString(), 110, yPosition);
      doc.text(`GHS ${customer.totalSpend.toFixed(2)}`, 150, yPosition);
      doc.text(`GHS ${(customer.totalSpend / customer.visits).toFixed(2)}`, 180, yPosition);
      
      yPosition += 10;
    });
    
    doc.save(`${restaurant.name}_spend_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Total Revenue</div>
          <div className="text-2xl font-bold">
            GHS {customerDetails.reduce((sum, customer) => sum + customer.totalSpend, 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Avg. Customer Spend</div>
          <div className="text-2xl font-bold">
            GHS {customerDetails.length > 0 
              ? (customerDetails.reduce((sum, customer) => sum + customer.totalSpend, 0) / customerDetails.length).toFixed(2)
              : '0.00'}
          </div>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Top 5 Customers</div>
          <div className="text-2xl font-bold">
            {customerDetails.length > 0 
                ? (
                    (
                    customerDetails.slice(0, 5).reduce((sum, customer) => sum + customer.totalSpend, 0) / 
                    customerDetails.reduce((sum, customer) => sum + customer.totalSpend, 0)
                    ) * 100
                ).toFixed(1) + '%'
                : '0%'}
          </div>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Repeat Customers</div>
          <div className="text-2xl font-bold">
            {customerDetails.filter(c => c.visits > 1).length} / {customerDetails.length}
          </div>
        </div>
      </div>

      {/* Time Frame Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Revenue Analytics</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFrame('week')}
            className={`px-3 py-1 rounded-md text-sm ${timeFrame === 'week' ? 'bg-yellow-500 text-white' : 'bg-gray-700'}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeFrame('month')}
            className={`px-3 py-1 rounded-md text-sm ${timeFrame === 'month' ? 'bg-yellow-500 text-white' : 'bg-gray-700'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-gray-700/50 p-4 rounded-lg h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={timeFrame === 'month' ? spendData.monthly : spendData.weekly}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis dataKey={timeFrame === 'month' ? 'month' : 'week'} stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4b5563' }}
              formatter={(value) => [`GHS ${value}`, 'Revenue']}
            />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill="#eab308" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Customers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers Pie Chart */}
        <div className="bg-gray-700/50 p-4 rounded-lg h-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Top Customers Contribution</h3>
            <button 
              onClick={generateSpendReport}
              className="text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1 text-sm"
              title="Download spend report"
            >
              <Download size={16} /> Report
            </button>
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={spendData.topCustomers}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalSpend"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {spendData.topCustomers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4b5563' }}
                formatter={(value) => [`GHS ${value}`, 'Total Spend']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers Table */}
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Top Spending Customers</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-4 py-2 text-left">Customer</th>
                  <th className="px-4 py-2 text-left">Visits</th>
                  <th className="px-4 py-2 text-left">Total Spend</th>
                  <th className="px-4 py-2 text-left">Avg/Visit</th>
                </tr>
              </thead>
              <tbody>
                {customerDetails.slice(0, 5).map((customer, index) => (
                  <tr key={customer.email} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-gray-400">{customer.email}</div>
                    </td>
                    <td className="px-4 py-3">{customer.visits}</td>
                    <td className="px-4 py-3 text-yellow-400">GHS {customer.totalSpend.toFixed(2)}</td>
                    <td className="px-4 py-3">GHS {(customer.totalSpend / customer.visits).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Spend Details */}
      <div className="bg-gray-700/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Customer Spend Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Contact</th>
                <th className="px-4 py-2 text-left">Visits</th>
                <th className="px-4 py-2 text-left">Total Spend</th>
                <th className="px-4 py-2 text-left">Avg/Visit</th>
                <th className="px-4 py-2 text-left">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {customerDetails.map((customer) => (
                <tr key={customer.email} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-gray-400">{customer.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{customer.phone}</div>
                  </td>
                  <td className="px-4 py-3">{customer.visits}</td>
                  <td className="px-4 py-3 text-yellow-400">GHS {customer.totalSpend.toFixed(2)}</td>
                  <td className="px-4 py-3">GHS {(customer.totalSpend / customer.visits).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {customer.lastVisit && new Date(customer.lastVisit).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerSpendAnalytics;