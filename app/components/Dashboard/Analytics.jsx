'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Download, Calendar as CalendarIcon, DollarSign, Users, Clock, TrendingUp } from 'lucide-react';
import { jsPDF } from "jspdf";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const LuxuryAnalyticsDashboard = ({ restaurant, reservations }) => {
  const [date, setDate] = useState(new Date());
  const [revenueData, setRevenueData] = useState({});
  const [activeMetric, setActiveMetric] = useState('reservations');
  const [timeRange, setTimeRange] = useState('month');

  // Process reservation data for charts
  const processReservationData = () => {
    const monthlyData = {};
    const dailyData = {};
    const hourlyData = {};

    reservations.forEach(res => {
      // Monthly data
      const month = new Date(res.date).toLocaleString('default', { month: 'short' });
      monthlyData[month] = (monthlyData[month] || 0) + 1;

      // Daily data (for selected month)
      if (new Date(res.date).getMonth() === date?.getMonth()) {
        const day = new Date(res.date).getDate();
        dailyData[day] = (dailyData[day] || 0) + 1;
      }

      // Hourly data
      const hour = res.time.split(':')[0];
      const hourLabel = `${hour}:00 - ${parseInt(hour)+1}:00`;
      hourlyData[hourLabel] = (hourlyData[hourLabel] || 0) + 1;
    });

    return {
      monthly: Object.keys(monthlyData).map(month => ({
        name: month,
        reservations: monthlyData[month],
        revenue: monthlyData[month] * (restaurant?.booking_cost || 0)
      })),
      daily: Object.keys(dailyData).map(day => ({
        name: day,
        reservations: dailyData[day],
        revenue: dailyData[day] * (restaurant?.booking_cost || 0)
      })),
      hourly: Object.keys(hourlyData).map(hour => ({
        name: hour,
        reservations: hourlyData[hour],
        revenue: hourlyData[hour] * (restaurant?.booking_cost || 0)
      }))
    };
  };

  const chartData = processReservationData();
  const currentData = timeRange === 'month' ? chartData.monthly : 
                     timeRange === 'day' ? chartData.daily : 
                     chartData.hourly;

  // Calculate metrics
  const totalReservations = reservations.length;
  const totalRevenue = totalReservations * (restaurant?.booking_cost || 0);
  const repeatCustomers = Array.from(new Set(reservations.map(r => r.email))).length;
  const peakHour = Object.entries(chartData.hourly).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Calendar day modifier for revenue
  const revenueDays = reservations.reduce((acc, res) => {
    const day = new Date(res.date).toISOString().split('T')[0];
    acc[day] = (acc[day] || 0) + (restaurant?.booking_cost || 0);
    return acc;
  }, {});

  const dayModifiers = {
    revenue: Object.keys(revenueDays).map(day => new Date(day))
  };

  // Generate PDF report
  const generateLuxuryReport = () => {
    const doc = new jsPDF();
    
    // Luxury styling
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, 'F');
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text(`${restaurant?.name || 'Luxury Establishment'} Analytics Report`, 105, 25, null, null, 'center');
    
    // Date
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    })}`, 105, 35, null, null, 'center');
    
    // Summary section
    doc.setFillColor(255, 255, 255);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Performance Summary', 20, 50);
    
    // Summary metrics
    doc.setFontSize(12);
    doc.text(`Total Reservations: ${totalReservations}`, 20, 60);
    doc.text(`Total Revenue: GHS ${totalRevenue.toLocaleString()}`, 20, 70);
    doc.text(`Repeat Customers: ${repeatCustomers}`, 20, 80);
    doc.text(`Peak Hour: ${peakHour}`, 20, 90);
        
    doc.save(`${restaurant?.name || 'luxury'}_analytics_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-opacity-90 backdrop-blur-sm border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Reservations</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalReservations}</div>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-opacity-90 backdrop-blur-sm border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">GHS {totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-400 mt-1">Potential earnings</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-opacity-90 backdrop-blur-sm border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Repeat Clients</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{repeatCustomers}</div>
              <p className="text-xs text-gray-400 mt-1">Loyal customers</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-opacity-90 backdrop-blur-sm border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Peak Hour</CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{peakHour}</div>
              <p className="text-xs text-gray-400 mt-1">Most popular time</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Calendar and Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Calendar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-1"
        >
          <Card className="bg-opacity-90 backdrop-blur-sm border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-200">
                <CalendarIcon className="h-5 w-5" />
                <span>Revenue Calendar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                modifiers={{
                  revenue: dayModifiers.revenue
                }}
                modifiersStyles={{
                  revenue: {
                    border: '2px solid #f59e0b',
                    borderRadius: '50%'
                  }
                }}
                className="rounded-md border-gray-700"
              />
              {revenueDays[date.toISOString().split('T')[0]] && (
                <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-300">Revenue on {date.toLocaleDateString()}:</p>
                  <p className="text-xl font-semibold text-amber-400">
                    GHS {revenueDays[date.toISOString().split('T')[0]].toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="bg-opacity-90 backdrop-blur-sm border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-gray-200">
                  {timeRange === 'month' ? 'Monthly' : timeRange === 'day' ? 'Daily' : 'Hourly'} Performance
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={activeMetric === 'reservations' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setActiveMetric('reservations')}
                  >
                    Reservations
                  </Button>
                  <Button
                    variant={activeMetric === 'revenue' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setActiveMetric('revenue')}
                  >
                    Revenue
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={timeRange === 'month' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setTimeRange('month')}
                >
                  Monthly
                </Button>
                <Button
                  variant={timeRange === 'day' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setTimeRange('day')}
                >
                  Daily
                </Button>
                <Button
                  variant={timeRange === 'hour' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setTimeRange('hour')}
                >
                  Hourly
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      borderColor: '#374151',
                      borderRadius: '0.375rem',
                      color: '#F3F4F6'
                    }}
                    formatter={(value) => [
                      activeMetric === 'revenue' ? `GHS ${value.toLocaleString()}` : value,
                      activeMetric === 'revenue' ? 'Revenue' : 'Reservations'
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{
                      fontSize: '12px',
                      color: '#E5E7EB',
                      paddingTop: '10px'
                    }}
                  />
                  <Bar
                    dataKey={activeMetric === 'revenue' ? 'revenue' : 'reservations'}
                    name={activeMetric === 'revenue' ? 'Revenue' : 'Reservations'}
                    fill={activeMetric === 'revenue' ? '#F59E0B' : '#8B5CF6'}
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Customer Segmentation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-opacity-90 backdrop-blur-sm border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-gray-200">Customer Segmentation</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs flex gap-1"
                onClick={generateLuxuryReport}
              >
                <Download className="h-3 w-3" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Type */}
              <div className="h-64">
                <h3 className="text-sm font-medium text-gray-300 mb-4">Customer Type Distribution</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'New Customers', value: 60, fill: '#60A5FA' },
                        { name: 'Returning Customers', value: 40, fill: '#A78BFA' },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      <Cell fill="#60A5FA" />
                      <Cell fill="#A78BFA" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151', 
                        borderRadius: '6px',
                        color: '#F3F4F6'
                      }}
                      formatter={(value, name) => [`${value}%`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Peak Times */}
              <div className="h-64">
                <h3 className="text-sm font-medium text-gray-300 mb-4">Peak Reservation Times</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Morning (8AM-12PM)', value: 30, fill: '#F472B6' },
                        { name: 'Afternoon (12PM-5PM)', value: 50, fill: '#FB923C' },
                        { name: 'Evening (5PM-10PM)', value: 20, fill: '#818CF8' },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      <Cell fill="#F472B6" />
                      <Cell fill="#FB923C" />
                      <Cell fill="#818CF8" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151', 
                        borderRadius: '6px',
                        color: '#F3F4F6'
                      }}
                      formatter={(value, name) => [`${value}%`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LuxuryAnalyticsDashboard;