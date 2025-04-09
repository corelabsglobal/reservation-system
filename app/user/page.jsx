"use client"

import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/structure/header'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { FiCalendar, FiClock, FiUsers, FiStar, FiDollarSign, FiAward } from 'react-icons/fi'

const UserProfilePage = () => {
  const [userData, setUserData] = useState(null)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('id, name, email, created_at, role')
          .eq('owner_id', user.id)
          .single()

        // Fetch user reservations
        const { data: userReservations } = await supabase
          .from('reservations')
          .select('id, date, time, people, occasion, special_request, paid, created_at')
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        // Calculate stats
        const totalReservations = userReservations?.length || 0
        const totalGuests = userReservations?.reduce((sum, r) => sum + (r.people || 0), 0) || 0
        const paidReservations = userReservations?.filter(r => r.paid).length || 0
        const mostCommonOccasion = userReservations?.reduce((acc, r) => {
          const occasion = r.occasion || 'Other'
          acc[occasion] = (acc[occasion] || 0) + 1
          return acc
        }, {}) || {}

        setUserData({
          ...profile,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${profile?.name || 'User'}&backgroundType=gradientLinear`
        })
        setReservations(userReservations || [])
        setStats({
          totalReservations,
          totalGuests,
          paidReservations,
          mostCommonOccasion: Object.entries(mostCommonOccasion).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None',
          joinDate: new Date(profile?.created_at).toLocaleDateString()
        })
      }
      setLoading(false)
    }

    fetchUserData()
  }, [])

  // Process reservation data for charts
  const processReservationData = () => {
    if (!reservations || reservations.length === 0) return []
    
    // Group by month
    const monthlyData = reservations.reduce((acc, reservation) => {
      const date = new Date(reservation.date)
      const month = date.toLocaleString('default', { month: 'short' })
      const year = date.getFullYear()
      const key = `${month} ${year}`
      
      if (!acc[key]) {
        acc[key] = 0
      }
      acc[key]++
      
      return acc
    }, {})
    
    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      reservations: count
    })).reverse()
  }

  // Process occasion data for pie chart
  const processOccasionData = () => {
    if (!reservations || reservations.length === 0) return []
    
    const occasionCounts = reservations.reduce((acc, reservation) => {
      const occasion = reservation.occasion || 'Other'
      acc[occasion] = (acc[occasion] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(occasionCounts).map(([name, value]) => ({
      name,
      value
    }))
  }

  // Process time distribution data
  const processTimeData = () => {
    if (!reservations || reservations.length === 0) return []
    
    const timeSlots = {
      'Morning (6AM-11AM)': 0,
      'Afternoon (11AM-4PM)': 0,
      'Evening (4PM-9PM)': 0,
      'Night (9PM-6AM)': 0
    }
    
    reservations.forEach(reservation => {
      const hour = parseInt(reservation.time.split(':')[0])
      if (hour >= 6 && hour < 11) timeSlots['Morning (6AM-11AM)']++
      else if (hour >= 11 && hour < 16) timeSlots['Afternoon (11AM-4PM)']++
      else if (hour >= 16 && hour < 21) timeSlots['Evening (4PM-9PM)']++
      else timeSlots['Night (9PM-6AM)']++
    })
    
    return Object.entries(timeSlots).map(([name, value]) => ({
      name,
      value
    }))
  }

  const chartData = processReservationData()
  const occasionData = processOccasionData()
  const timeData = processTimeData()

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="animate-pulse text-2xl font-medium text-indigo-600">Loading your profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        {/* Profile Header */}
        <Header />
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 mt-14">
          <div className="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-600">
            <div className="absolute -bottom-16 left-8">
              <div className="h-32 w-32 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden">
                <img 
                  src={userData?.avatar} 
                  alt={userData?.name} 
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
          <div className="pt-20 px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{userData?.name}</h1>
                <p className="text-indigo-600 mt-1">{userData?.email}</p>
                <p className="text-gray-500 mt-2">Member since {stats?.joinDate}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <span className="inline-block bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                  {userData?.role || 'Member'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-2xl shadow-lg p-6 flex items-center"
          >
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <FiCalendar className="text-2xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Reservations</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalReservations || 0}</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-2xl shadow-lg p-6 flex items-center"
          >
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FiUsers className="text-2xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Guests</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalGuests || 0}</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-2xl shadow-lg p-6 flex items-center"
          >
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <FiStar className="text-2xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Favorite Occasion</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.mostCommonOccasion || 'None'}</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-2xl shadow-lg p-6 flex items-center"
          >
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <FiDollarSign className="text-2xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Paid Reservations</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.paidReservations || 0}</p>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Tabs */}
        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 ${activeTab === 'reservations' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              My Reservations
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Monthly Reservations Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Reservations Over Time</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#f9fafb'
                      }}
                    />
                    <Bar
                      dataKey="reservations"
                      name="Reservations"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Occasion and Time Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Reservation Occasions</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={occasionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {occasionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: '#f9fafb'
                        }}
                        formatter={(value, name) => [`${value} reservations`, name]}
                      />
                      <Legend 
                        wrapperStyle={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Preferred Time Slots</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: '#f9fafb'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Reservations"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">My Reservations</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {reservations.length > 0 ? (
                reservations.map((reservation, index) => (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-6 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center">
                          <span className="text-lg font-medium text-gray-900">
                            {new Date(reservation.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="mx-2 text-gray-400">|</span>
                          <span className="text-gray-600 flex items-center">
                            <FiClock className="mr-1" />
                            {reservation.time}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {reservation.occasion || 'General'}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {reservation.people} {reservation.people === 1 ? 'person' : 'people'}
                          </span>
                          {reservation.paid && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Paid
                            </span>
                          )}
                        </div>
                        {reservation.special_request && (
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Special Request:</span> {reservation.special_request}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 sm:mt-0">
                        <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          View Details
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <FiCalendar className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No reservations yet</h3>
                  <p className="mt-1 text-sm text-gray-500">You haven't made any reservations yet.</p>
                  <div className="mt-6">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Make a reservation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default UserProfilePage