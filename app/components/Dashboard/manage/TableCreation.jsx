'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const TableManagement = ({ restaurant }) => {
  const [tables, setTables] = useState([]);
  const [tableTypes, setTableTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTableId, setEditingTableId] = useState(null);
  const [editingTableName, setEditingTableName] = useState('');
  
  // Form state with custom capacity option
  const [newTable, setNewTable] = useState({
    name: '',
    capacity: 2,
    customCapacity: '',
    description: '',
    quantity: 1,
    useCustomCapacity: false
  });

  // Fetch tables and table types
  useEffect(() => {
    if (restaurant) {
      fetchTables();
      fetchTableTypes();
    }
  }, [restaurant]);

  const fetchTables = async () => {
    try {
      const { data: tablesData, error } = await supabase
        .from('tables')
        .select('*, table_types(*)')
        .eq('restaurant_id', restaurant.id)
        .eq('is_deleted', false) // Only fetch non-deleted tables
        .order('table_number');

      if (error) throw error;
      setTables(tablesData || []);

    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load tables');
    }
  };

  const fetchTableTypes = async () => {
    try {
      const { data: typesData, error } = await supabase
        .from('table_types')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('capacity');

      if (error) throw error;
      setTableTypes(typesData || []);

    } catch (error) {
      console.error('Error fetching table types:', error);
    }
  };

  // Get available capacities from existing table types
  const getAvailableCapacities = () => {
    const capacities = tableTypes.map(type => type.capacity);
    const uniqueCapacities = [...new Set(capacities)].sort((a, b) => a - b);
    
    // Add common capacities if they don't exist
    const commonCapacities = [2, 4, 6, 8, 10, 12];
    commonCapacities.forEach(cap => {
      if (!uniqueCapacities.includes(cap)) {
        uniqueCapacities.push(cap);
      }
    });
    
    return uniqueCapacities.sort((a, b) => a - b);
  };

  // Start editing a table name
  const startEditing = (table) => {
    setEditingTableId(table.id);
    setEditingTableName(table.table_number);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTableId(null);
    setEditingTableName('');
  };

  // Save edited table name
  const saveTableName = async (tableId) => {
    if (!editingTableName.trim()) {
      toast.error('Table name cannot be empty');
      return;
    }

    const existingTable = tables.find(
      table => table.table_number === editingTableName.trim() && table.id !== tableId
    );

    if (existingTable) {
      toast.error('A table with this name already exists');
      return;
    }

    try {
      const { error } = await supabase
        .from('tables')
        .update({ table_number: editingTableName.trim() })
        .eq('id', tableId);

      if (error) throw error;

      // Update local state
      setTables(prev => prev.map(table => 
        table.id === tableId 
          ? { ...table, table_number: editingTableName.trim() }
          : table
      ));

      toast.success('Table name updated successfully');
      setEditingTableId(null);
      setEditingTableName('');

    } catch (error) {
      console.error('Error updating table name:', error);
      toast.error('Failed to update table name');
    }
  };

  // Smart table creation - handles types automatically in background
  const createTable = async () => {
    if (!restaurant) {
      toast.error('Restaurant information not loaded');
      return;
    }

    if (!newTable.name.trim()) {
      toast.error('Please enter a table name/number');
      return;
    }

    const finalCapacity = newTable.useCustomCapacity 
      ? parseInt(newTable.customCapacity) 
      : newTable.capacity;

    if (!finalCapacity || finalCapacity < 1 || finalCapacity > 50) {
      toast.error('Please enter a valid capacity between 1 and 50');
      return;
    }

    setLoading(true);

    try {
      // First, find or create an appropriate table type
      const tableTypeId = await findOrCreateTableType(finalCapacity);

      // Create the actual tables
      const tablesToCreate = [];
      const quantity = newTable.quantity || 1;

      for (let i = 0; i < quantity; i++) {
        const tableName = quantity > 1 
          ? `${newTable.name}${i + 1}`
          : newTable.name;

        tablesToCreate.push({
          table_type_id: tableTypeId,
          table_number: tableName,
          position_description: newTable.description.trim(),
          restaurant_id: restaurant.id,
          is_available: true,
          is_deleted: false // Explicitly set to false for new tables
        });
      }

      const { data: createdTables, error: tablesError } = await supabase
        .from('tables')
        .insert(tablesToCreate)
        .select('*, table_types(*)');

      if (tablesError) throw tablesError;

      setTables(prev => [...prev, ...createdTables]);
      
      // Reset form
      setNewTable({
        name: '',
        capacity: finalCapacity, // Keep the last used capacity
        customCapacity: '',
        description: '',
        quantity: 1,
        useCustomCapacity: false
      });

      // Refresh table types in case we created a new one
      await fetchTableTypes();

      toast.success(`Successfully created ${quantity} table${quantity > 1 ? 's' : ''}`);
      
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error('Failed to create table');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle table types automatically
  const findOrCreateTableType = async (capacity) => {
    // Create a type name based on capacity for consistency
    const typeName = `${capacity}-Seater`;
    
    // Check if this type already exists
    const { data: existingType, error: fetchError } = await supabase
      .from('table_types')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('capacity', capacity)
      .single(); // Only match by capacity, not name

    if (!fetchError && existingType) {
      return existingType.id;
    }

    // Create new type if it doesn't exist
    const { data: newType, error: createError } = await supabase
      .from('table_types')
      .insert([{
        name: typeName,
        capacity: capacity,
        description: `Table for ${capacity} people`,
        restaurant_id: restaurant.id
      }])
      .select()
      .single();

    if (createError) {
      // If there's a conflict, try to find the type again
      if (createError.code === '23505') { // Unique violation
        const { data: conflictedType } = await supabase
          .from('table_types')
          .select('id')
          .eq('restaurant_id', restaurant.id)
          .eq('capacity', capacity)
          .single();
        
        if (conflictedType) return conflictedType.id;
      }
      throw createError;
    }
    
    return newType.id;
  };

  // Delete table with soft delete logic
  const deleteTable = async (tableId) => {
    try {
      // Check if table has active reservations (non-cancelled)
      const { data: reservations, error: reservationError } = await supabase
        .from('reservations')
        .select('id, cancelled')
        .eq('table_id', tableId);

      if (reservationError) throw reservationError;

      const hasActiveReservations = reservations?.some(res => !res.cancelled);

      if (hasActiveReservations) {
        // If table has active reservations, perform soft delete
        const { error } = await supabase
          .from('tables')
          .update({ is_deleted: true })
          .eq('id', tableId);

        if (error) throw error;

        // Update local state to remove the table
        setTables(prev => prev.filter(table => table.id !== tableId));
        toast.success('Table deleted temporarily');
        
      } else {
        // If no active reservations, check if table has any reservations at all
        const hasAnyReservations = reservations && reservations.length > 0;

        if (hasAnyReservations) {
          // Table has only cancelled reservations - still soft delete for data integrity
          const { error } = await supabase
            .from('tables')
            .update({ is_deleted: true })
            .eq('id', tableId);

          if (error) throw error;

          setTables(prev => prev.filter(table => table.id !== tableId));
          toast.success('Table archived successfully');
        } else {
          // Table has no reservations at all - perform hard delete
          const { error } = await supabase
            .from('tables')
            .delete()
            .eq('id', tableId);

          if (error) throw error;

          setTables(prev => prev.filter(table => table.id !== tableId));
          toast.success('Table deleted');
        }
      }

    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    }
  };

  const availableCapacities = getAvailableCapacities();

  return (
    <div className="bg-gray-700/50 p-6 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-xl font-bold text-yellow-400">Table Management</h3>
        <div className="group relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute hidden group-hover:block bottom-full mb-2 w-80 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg z-10">
            Add tables by name and capacity. Choose from existing seat options or enter a custom number. Click on table names to edit them.
            Tables with active reservations will be archived instead of permanently deleted.
          </div>
        </div>
      </div>

      {/* Quick Add Section - Always visible */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h4 className="font-semibold text-gray-300 mb-4">Add New Tables</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Table Name/Number *
            </label>
            <input
              type="text"
              placeholder="e.g., 1, A1, Window Table"
              value={newTable.name}
              onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Seats *
            </label>
            <div className="space-y-2">
              <select
                value={newTable.useCustomCapacity ? 'custom' : newTable.capacity}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setNewTable({ ...newTable, useCustomCapacity: true });
                  } else {
                    setNewTable({ 
                      ...newTable, 
                      capacity: parseInt(e.target.value),
                      useCustomCapacity: false 
                    });
                  }
                }}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                {availableCapacities.map(num => (
                  <option key={num} value={num}>{num} people</option>
                ))}
                <option value="custom">Custom number...</option>
              </select>
              
              {newTable.useCustomCapacity && (
                <input
                  type="number"
                  min="1"
                  max="50"
                  placeholder="Enter number of seats"
                  value={newTable.customCapacity}
                  onChange={(e) => setNewTable({ ...newTable, customCapacity: e.target.value })}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Quantity
            </label>
            <select
              value={newTable.quantity}
              onChange={(e) => setNewTable({ ...newTable, quantity: parseInt(e.target.value) })}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Location Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g., Near window, Corner spot, Main hall"
            value={newTable.description}
            onChange={(e) => setNewTable({ ...newTable, description: e.target.value })}
            className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        <button
          onClick={createTable}
          disabled={loading || !newTable.name.trim() || 
            (newTable.useCustomCapacity && (!newTable.customCapacity || parseInt(newTable.customCapacity) < 1))}
          className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-pink-600 py-3 px-6 rounded-lg hover:opacity-90 transition-all text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : `Add ${newTable.quantity > 1 ? `${newTable.quantity} Tables` : 'Table'}`}
        </button>
      </div>

      {/* Current Tables - Always visible */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-300 mb-4">
          Current Tables ({tables.length})
        </h4>
        
        {tables.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No tables yet</div>
            <div className="text-sm text-gray-500">Add your first table using the form above</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
            {tables.map(table => (
              <div key={table.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {editingTableId === table.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTableName}
                            onChange={(e) => setEditingTableName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveTableName(table.id);
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            className="p-1 bg-gray-600 border border-yellow-400 rounded text-white text-lg font-bold w-32"
                            autoFocus
                          />
                          <button
                            onClick={() => saveTableName(table.id)}
                            className="text-green-400 hover:text-green-300 p-1"
                            title="Save"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-400 hover:text-gray-300 p-1"
                            title="Cancel"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-bold text-white text-lg cursor-pointer hover:text-yellow-400 transition-colors"
                            onClick={() => startEditing(table)}
                            title="Click to edit table name"
                          >
                            {table.table_number}
                          </span>
                          <button
                            onClick={() => startEditing(table)}
                            className="text-gray-400 hover:text-yellow-400 p-1 transition-colors"
                            title="Edit table name"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <span className="text-sm bg-yellow-500 text-black px-2 py-1 rounded-full font-medium">
                        {table.table_types.capacity} seats
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-300 mb-2">
                      {table.table_types.name}
                    </div>
                    
                    {table.position_description && (
                      <div className="text-sm text-gray-400 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {table.position_description}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => deleteTable(table.id)}
                    className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                    title="Delete table"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  Added {new Date(table.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableManagement;