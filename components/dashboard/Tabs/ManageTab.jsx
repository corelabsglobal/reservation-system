'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import SideImagesUploader from '@/app/components/Dashboard/SideImagesUploader';
import TableAssignmentManager from '@/app/components/structure/TableAssignmentManager';
import ClosureDaysManager from '@/app/components/structure/ClosureDaysManager';
import ReservationTimingManager from '@/app/components/Dashboard/ReservationTimingManager';
import RestaurantInfoManager from '@/app/components/Dashboard/RestaurantInfoManager';

const ManageTab = ({ activeSubTab, restaurant, onUpdateRestaurant }) => {
  const [newImage, setNewImage] = useState(null);
  const [bookingCostInput, setBookingCostInput] = useState(0);
  const [bookingCostTiers, setBookingCostTiers] = useState([]);
  const [newCostTier, setNewCostTier] = useState({
    min_people: 1,
    max_people: 1,
    cost: 0
  });

  // Table management state
  const [tableTypes, setTableTypes] = useState([]);
  const [tables, setTables] = useState([]);
  const [newTableType, setNewTableType] = useState({
    name: '',
    capacity: 2,
    description: ''
  });
  const [newTable, setNewTable] = useState({
    table_type_id: '',
    table_number: '',
    position_description: ''
  });

  useEffect(() => {
    if (restaurant) {
      setBookingCostInput(restaurant.booking_cost || 0);
    }
  }, [restaurant]);

  useEffect(() => {
    const fetchBookingCostTiers = async () => {
      if (!restaurant) return;
      
      const { data, error } = await supabase
        .from('booking_cost_tiers')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('min_people', { ascending: true });
      
      if (!error) setBookingCostTiers(data);
    };
    
    if (restaurant) fetchBookingCostTiers();
  }, [restaurant]);

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

  // Table Type Management Functions
  const addTableType = async () => {
    if (!restaurant) {
      toast.error('Restaurant information not loaded yet');
      return;
    }

    if (!newTableType.name || !newTableType.capacity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { data, error } = await supabase
      .from('table_types')
      .insert([{ ...newTableType, restaurant_id: restaurant.id }])
      .select();
    
    if (error) {
      toast.error('Failed to add table type');
    } else {
      toast.success('Table type added successfully');
      setTableTypes([...tableTypes, data[0]]);
      setNewTableType({ name: '', capacity: 2, description: '' });
    }
  };

  const deleteTableType = async (typeId) => {
    const { count } = await supabase
      .from('tables')
      .select('*', { count: 'exact' })
      .eq('table_type_id', typeId);
    
    if (count > 0) {
      toast.error('Cannot delete table type - tables are assigned to it');
      return;
    }
    
    const { error } = await supabase
      .from('table_types')
      .delete()
      .eq('id', typeId);
    
    if (error) {
      toast.error('Failed to delete table type');
    } else {
      toast.success('Table type deleted successfully');
      setTableTypes(tableTypes.filter(type => type.id !== typeId));
    }
  };

  // Table Management Functions
  const addTable = async () => {
    if (!newTable.table_type_id || !newTable.table_number) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Check if table_number is a number (for multiple tables)
      const tableCount = parseInt(newTable.table_number);
      const isMultipleTables = !isNaN(tableCount) && tableCount > 1;

      if (isMultipleTables) {
        // Create multiple tables
        const tablesToInsert = Array.from({ length: tableCount }, (_, i) => ({
          table_type_id: newTable.table_type_id,
          table_number: (i + 1).toString(),
          position_description: newTable.position_description,
          restaurant_id: restaurant.id,
          is_available: true
        }));

        const { data, error } = await supabase
          .from('tables')
          .insert(tablesToInsert)
          .select();

        if (error) throw error;

        // Fetch all the newly created tables with their types
        const { data: fullTablesData } = await supabase
          .from('tables')
          .select('*, table_types(*)')
          .in('id', data.map(t => t.id));

        setTables([...tables, ...fullTablesData]);
        toast.success(`Created ${tableCount} tables successfully`);
      } else {
        // Single table creation
        const { data, error } = await supabase
          .from('tables')
          .insert([{ 
            ...newTable, 
            restaurant_id: restaurant.id,
            is_available: true 
          }])
          .select();
        
        if (error) throw error;

        const { data: fullTableData } = await supabase
          .from('tables')
          .select('*, table_types(*)')
          .eq('id', data[0].id)
          .single();
        
        setTables([...tables, fullTableData]);
        toast.success('Table added successfully');
      }

      // Reset form
      setNewTable({
        table_type_id: '',
        table_number: '',
        position_description: ''
      });

    } catch (error) {
      console.error('Error adding table(s):', error);
      toast.error(error.message || 'Failed to add table(s)');
    }
  };

  const deleteTable = async (tableId) => {
    try {
      const { count: reservationCount, error: reservationError } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('table_id', tableId);
  
      if (reservationError) throw reservationError;
  
      if (reservationCount > 0) {
        toast.error('Cannot delete table - It has existing reservations');
        return;
      }
  
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);
      
      if (error) throw error;
  
      toast.success('Table deleted successfully');
      setTables(tables.filter(table => table.id !== tableId));
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
  
      if (data.url) {
        setNewImage(data.url);
        toast.success('Image uploaded to Cloudinary');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      toast.error('Error uploading image');
      console.error(error);
    }
  };
  
  const updateRestaurantImage = async () => {
    if (!newImage) return;
  
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ restaurant_image: newImage })
        .eq('id', restaurant.id);
  
      if (error) {
        toast.error('Failed to update image in Supabase');
      } else {
        toast.success('Image updated successfully');
        onUpdateRestaurant({ ...restaurant, restaurant_image: newImage });
        setNewImage(null);
      }
    } catch (error) {
      toast.error('Error updating image');
      console.error(error);
    }
  };

  const addBookingCostTier = async () => {
    if (!restaurant) {
      toast.error('Restaurant information not loaded yet');
      return;
    }

    if (!newCostTier.min_people || !newCostTier.max_people || !newCostTier.cost) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newCostTier.min_people > newCostTier.max_people) {
      toast.error('Minimum people cannot be greater than maximum people');
      return;
    }

    const hasOverlap = bookingCostTiers.some(tier => 
      (newCostTier.min_people <= tier.max_people && newCostTier.max_people >= tier.min_people)
    );

    if (hasOverlap) {
      toast.error('This range overlaps with an existing tier');
      return;
    }

    const { data, error } = await supabase
      .from('booking_cost_tiers')
      .insert([{ 
        ...newCostTier, 
        restaurant_id: restaurant.id 
      }])
      .select();
    
    if (error) {
      toast.error('Failed to add booking cost tier');
    } else {
      toast.success('Booking cost tier added successfully');
      setBookingCostTiers([...bookingCostTiers, data[0]]);
      setNewCostTier({ min_people: 1, max_people: 1, cost: 0 });
    }
  };

  const deleteBookingCostTier = async (tierId) => {
    const { error } = await supabase
      .from('booking_cost_tiers')
      .delete()
      .eq('id', tierId);
    
    if (error) {
      toast.error('Failed to delete booking cost tier');
    } else {
      toast.success('Booking cost tier deleted successfully');
      setBookingCostTiers(bookingCostTiers.filter(tier => tier.id !== tierId));
    }
  };

  const updateBookingCost = async () => {
    try {
      if (!restaurant?.id) {
        toast.error('Restaurant information not loaded yet');
        return;
      }

      if (bookingCostTiers.length === 0) {
        const cost = bookingCostInput === '' || bookingCostInput === null ? null : Math.floor(Number(bookingCostInput));
        
        if (cost !== null && (isNaN(cost) || cost < 0)) {
          toast.error('Please enter a valid positive number');
          return;
        }

        const { error } = await supabase
          .from('restaurants')
          .update({ booking_cost: cost })
          .eq('id', restaurant.id);

        if (error) throw error;

        const { data } = await supabase
          .from('restaurants')
          .select('booking_cost')
          .eq('id', restaurant.id)
          .single();

        if (!data) throw new Error('Failed to verify update');
        
        onUpdateRestaurant({ ...restaurant, booking_cost: data.booking_cost });
        setBookingCostInput(data.booking_cost === null ? '' : data.booking_cost);

        toast.success(
          data.booking_cost === null 
            ? 'Booking cost cleared' 
            : `Booking cost set to GHS ${data.booking_cost}`
        );
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update booking cost');
    }
  };

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'restaurant':
        return (
          <div className="space-y-6">
            {/* Update Restaurant Image Section */}
            <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-bold text-yellow-400">Update Restaurant Image</h3>
                <div className="group relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute hidden group-hover:block bottom-full mb-2 w-64 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg">
                    Upload a new image for your restaurant. This will be displayed to customers when they browse your restaurant.
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <img
                  src={restaurant?.restaurant_image || '/images/placeholder.jpg'}
                  alt="Restaurant"
                  className="w-32 h-32 rounded-lg object-cover shadow-md"
                />
                <div className="flex flex-col gap-4 w-full sm:w-auto">
                  <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="w-full p-2 bg-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                  />
                  {newImage && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">New preview:</span>
                        <img 
                          src={newImage} 
                          alt="New preview" 
                          className="w-12 h-12 rounded object-cover"
                        />
                      </div>
                      <button
                        onClick={updateRestaurantImage}
                        className="bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-2 rounded-lg hover:opacity-80 transition-all text-white font-semibold"
                      >
                        Confirm Update
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <SideImagesUploader 
              restaurant={restaurant} 
              onUpdate={() => {
                const fetchRestaurant = async () => {
                  const { data: user } = await supabase.auth.getUser();
                  if (!user) return;
                  
                  const { data } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('owner_id', user.user.id)
                    .single();
                  
                  if (data) onUpdateRestaurant(data);
                };
                fetchRestaurant();
              }}
            />

            <RestaurantInfoManager restaurant={restaurant} setRestaurant={onUpdateRestaurant} />
          </div>
        );

      case 'tables':
        return (
          <div className="space-y-6">
            <TableAssignmentManager 
              restaurant={restaurant} 
              onUpdate={() => {
                const fetchRestaurant = async () => {
                  const { data: user } = await supabase.auth.getUser();
                  if (!user) return;
                  
                  const { data } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('owner_id', user.user.id)
                    .single();
                  
                  if (data) onUpdateRestaurant(data);
                };
                fetchRestaurant();
              }}
            />

            {/* Table Type Management */}
            <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Table Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add Table Type Form */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-300">Add New Table Type</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Table Type Name"
                      value={newTableType.name}
                      onChange={(e) => setNewTableType({...newTableType, name: e.target.value})}
                      className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                    />
                    <input
                      type="number"
                      placeholder="Capacity"
                      min="1"
                      value={newTableType.capacity}
                      onChange={(e) => setNewTableType({...newTableType, capacity: parseInt(e.target.value)})}
                      className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newTableType.description}
                      onChange={(e) => setNewTableType({...newTableType, description: e.target.value})}
                      className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                      rows="2"
                    />
                    <button
                      onClick={addTableType}
                      className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded hover:opacity-90 transition-all text-white font-medium w-full"
                    >
                      Add Table Type
                    </button>
                  </div>
                </div>

                {/* Table Types List */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-300">Current Table Types</h4>
                  {tableTypes.length === 0 ? (
                    <p className="text-gray-400">No table types defined</p>
                  ) : (
                    <div className="space-y-2">
                      {tableTypes.map(type => (
                        <div key={type.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
                          <div>
                            <span className="font-medium  text-white">{type.name}</span>
                            <span className="text-sm text-gray-400 ml-2">(Capacity: {type.capacity})</span>
                            {type.description && (
                              <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteTableType(type.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table Management */}
            <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Manage Tables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add Table Form */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-300">Add New Table(s)</h4>
                  <div className="space-y-3">
                    <select
                      value={newTable.table_type_id}
                      onChange={(e) => setNewTable({...newTable, table_type_id: e.target.value})}
                      className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                    >
                      <option value="">Select Table Type</option>
                      {tableTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name} (Capacity: {type.capacity})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Table Number (or quantity for multiple)"
                      value={newTable.table_number}
                      onChange={(e) => setNewTable({...newTable, table_number: e.target.value})}
                      className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                    />
                    <textarea
                      placeholder="Position Description (optional)"
                      value={newTable.position_description}
                      onChange={(e) => setNewTable({...newTable, position_description: e.target.value})}
                      className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                      rows="2"
                    />
                    <button
                      onClick={addTable}
                      className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded hover:opacity-90 transition-all text-white font-medium w-full"
                    >
                      Add Table(s)
                    </button>
                  </div>
                </div>

                {/* Tables List */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-300">Current Tables</h4>
                  {tables.length === 0 ? (
                    <p className="text-gray-400">No tables defined</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {tables.map(table => (
                        <div key={table.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
                          <div>
                            <span className="font-medium text-white">Table {table.table_number}</span>
                            <span className="text-sm text-gray-400 ml-2">({table.table_types?.name})</span>
                            {table.position_description && (
                              <p className="text-xs text-gray-500 mt-1">{table.position_description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteTable(table.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-6">
            <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-bold text-yellow-400">Booking Pricing</h3>
              </div>
              
              {/* Single Booking Cost Option */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-gray-300">Single Booking Cost</h4>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <input
                    type="number"
                    value={bookingCostInput === null ? '' : bookingCostInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setBookingCostInput(value === '' ? null : Math.floor(Number(value)));
                    }}
                    min="0"
                    step="1"
                    className="p-2 bg-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 w-full sm:w-32"
                    placeholder={restaurant?.booking_cost === null ? "Not set" : "GHS"}
                    disabled={bookingCostTiers.length > 0}
                  />
                  
                  <button
                    onClick={updateBookingCost}
                    className="bg-gradient-to-r from-yellow-400 to-pink-600 px-5 py-2 rounded-lg hover:opacity-80 transition-all text-white font-semibold"
                    disabled={bookingCostTiers.length > 0}
                  >
                    {restaurant?.booking_cost === null ? "Set Cost" : "Update"}
                  </button>
                  
                  {restaurant?.booking_cost !== null && (
                    <button
                      onClick={() => {
                        setBookingCostInput(null);
                        updateBookingCost();
                      }}
                      className="bg-gray-500 px-3 py-2 rounded-lg hover:bg-gray-600 transition-all text-white"
                      disabled={bookingCostTiers.length > 0}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="mt-3 text-sm">
                  <p className="text-gray-300">
                    Current Booking Cost: {restaurant?.booking_cost === null ? (
                      <span className="text-yellow-300">NULL</span>
                    ) : (
                      <span className="text-green-400">GHS {restaurant?.booking_cost}</span>
                    )}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {restaurant?.booking_cost === null ? "No booking fee will be charged" : "This amount will be charged per booking"}
                  </p>
                </div>
              </div>

              {/* Tiered Pricing Option */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-300">Tiered Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Add New Tier Form */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h5 className="font-semibold mb-3 text-gray-300">Add New Pricing Tier</h5>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min people"
                          min="1"
                          value={newCostTier.min_people}
                          onChange={(e) => setNewCostTier({...newCostTier, min_people: parseInt(e.target.value)})}
                          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                        />
                        <input
                          type="number"
                          placeholder="Max people"
                          min="1"
                          value={newCostTier.max_people}
                          onChange={(e) => setNewCostTier({...newCostTier, max_people: parseInt(e.target.value)})}
                          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                        />
                      </div>
                      <input
                        type="number"
                        placeholder="Cost (GHS)"
                        min="0"
                        value={newCostTier.cost}
                        onChange={(e) => setNewCostTier({...newCostTier, cost: parseInt(e.target.value)})}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                      />
                      <button
                        onClick={addBookingCostTier}
                        className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded hover:opacity-90 transition-all text-white font-medium"
                      >
                        Add Pricing Tier
                      </button>
                    </div>
                  </div>

                  {/* Existing Tiers List */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h5 className="font-semibold mb-3 text-gray-300">Current Pricing Tiers</h5>
                    {bookingCostTiers.length === 0 ? (
                      <p className="text-gray-400">No pricing tiers defined</p>
                    ) : (
                      <div className="space-y-2">
                        {bookingCostTiers.map(tier => (
                          <div key={tier.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
                            <div>
                              <span className="font-medium text-white">{tier.min_people}-{tier.max_people} people</span> 
                              <span className="text-sm text-gray-400 ml-2">(GHS {tier.cost})</span>
                            </div>
                            <button
                              onClick={() => deleteBookingCostTier(tier.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-3">
                  When tiered pricing is set, it will override the single booking cost.
                </p>
              </div>
            </div>
          </div>
        );

      case 'settings':
      default:
        return (
          <div className="space-y-6">
            <ClosureDaysManager restaurant={restaurant} />
            <ReservationTimingManager restaurant={restaurant} setRestaurant={onUpdateRestaurant} />
          </div>
        );
    }
  };

  return (
    <div className="mb-6 p-6 shadow-2xl bg-gray-800/90 backdrop-blur-md rounded-xl">
      <h2 className="text-2xl font-semibold mb-6 text-yellow-400">Manage Restaurant</h2>
      
      {/* Sub Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['restaurant', 'tables', 'pricing', 'settings'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-lg capitalize transition-all ${
              activeSubTab === tab 
                ? 'bg-gradient-to-r from-yellow-400 to-pink-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {tab === 'restaurant' ? 'Restaurant Info' : 
             tab === 'tables' ? 'Tables & Layout' : 
             tab === 'pricing' ? 'Pricing' : 
             'Settings'}
          </button>
        ))}
      </div>

      {renderSubTabContent()}
    </div>
  );
};

export default ManageTab;