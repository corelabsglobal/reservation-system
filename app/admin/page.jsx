'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';

const ProfilePage = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);
  const [tableTypes, setTableTypes] = useState([]);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  // State for active tabs
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  
  const searchParams = useSearchParams();
  const router = useRouter();

  // Update URL when tabs change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    params.set('subtab', activeSubTab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [activeTab, activeSubTab, router]);

  // Initialize from URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const subtabParam = searchParams.get('subtab');
    
    if (tabParam && ['overview', 'customers', 'insights', 'reservations', 'manage'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    if (subtabParam) {
      setActiveSubTab(subtabParam);
    }
  }, [searchParams]);

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user) return;
      
      const { data, error: restError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.user.id)
        .single();
      
      if (restError) return;
      setRestaurant(data);
    };

    fetchRestaurant();
  }, []);

  // Fetch reservations
  useEffect(() => {
    const fetchReservations = async () => {
      if (!restaurant) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*, tables(table_number)')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });
  
      if (!error) {
        const markedData = data.map(res => ({
          ...res,
          table_number: res.tables?.table_number,
        }));
        setReservations(markedData);
      }
      setLoading(false);
    };
    
    if (restaurant) fetchReservations();
  }, [restaurant]);

  // Fetch table data
  useEffect(() => {
    const fetchTableData = async () => {
      if (!restaurant) return;
      
      // Fetch table types
      const { data: typesData, error: typesError } = await supabase
        .from('table_types')
        .select('*')
        .eq('restaurant_id', restaurant.id);
      
      if (!typesError) setTableTypes(typesData);
      
      // Fetch tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*, table_types(*)')
        .eq('restaurant_id', restaurant.id);
      
      if (!tablesError) setTables(tablesData);
    };
    
    if (restaurant) fetchTableData();
  }, [restaurant]);

  // Handler functions
  const markAsSeen = async (reservationId) => {
    const currentReservation = reservations.find(res => res.id === reservationId);
    const newSeenStatus = !currentReservation?.seen;

    const { error } = await supabase
      .from('reservations')
      .update({ seen: newSeenStatus })
      .eq('id', reservationId);
    
    if (!error) {
      setReservations(reservations.map(res => 
        res.id === reservationId ? { ...res, seen: newSeenStatus } : res
      ));
    }
  };

  const markAsAttended = async (reservationId) => {
    const currentReservation = reservations.find(res => res.id === reservationId);
    const newAttendedStatus = !currentReservation.attended;

    const { error } = await supabase
      .from('reservations')
      .update({ attended: newAttendedStatus })
      .eq('id', reservationId);

    if (!error) {
      setReservations(reservations.map(res =>
        res.id === reservationId ? { ...res, attended: newAttendedStatus } : res
      ));
    }
  };

  const cancelReservation = async (reservationId) => {
    // Your existing cancel reservation logic
    // ... (keep your existing cancelReservation function)
  };

  const handleReservationUpdate = (updatedReservation) => {
    setReservations(prevReservations => 
      prevReservations.map(res => 
        res.id === updatedReservation.id ? updatedReservation : res
      )
    );
  };

  const handleUpdateRestaurant = (updatedRestaurant) => {
    setRestaurant(updatedRestaurant);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout
      restaurant={restaurant}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      activeSubTab={activeSubTab}
      setActiveSubTab={setActiveSubTab}
    >
      <DashboardContent
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        restaurant={restaurant}
        reservations={reservations}
        tables={tables}
        tableTypes={tableTypes}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        onMarkAsSeen={markAsSeen}
        onMarkAsAttended={markAsAttended}
        onCancelReservation={cancelReservation}
        onReservationUpdate={handleReservationUpdate}
        onUpdateRestaurant={handleUpdateRestaurant}
      />
    </DashboardLayout>
  );
};

export default function ProfilePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePage />
    </Suspense>
  );
}