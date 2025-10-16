'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const TableManagement = ({ restaurant }) => {
  const [tableTypes, setTableTypes] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('create');
  
  // Combined form state for creating tables
  const [newTableForm, setNewTableForm] = useState({
    // Table type fields
    typeName: '',
    capacity: 2,
    description: '',
    // Table fields
    tableNumber: '',
    quantity: 1,
    positionDescription: '',
    // Whether to create a new type or use existing
    useExistingType: false,
    existingTypeId: ''
  });

  // Fetch table data
  useEffect(() => {
    if (restaurant) {
      fetchTableData();
    }
  }, [restaurant]);

  const fetchTableData = async () => {
    try {
      // Fetch table types
      const { data: typesData, error: typesError } = await supabase
        .from('table_types')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('name');

      if (typesError) throw typesError;
      setTableTypes(typesData || []);

      // Fetch tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*, table_types(*)')
        .eq('restaurant_id', restaurant.id)
        .order('table_number');

      if (tablesError) throw tablesError;
      setTables(tablesData || []);

    } catch (error) {
      console.error('Error fetching table data:', error);
      toast.error('Failed to load table data');
    }
  };

  // Create table type and tables in one go
  const createTableWithType = async () => {
    if (!restaurant) {
      toast.error('Restaurant information not loaded');
      return;
    }

    setLoading(true);

    try {
      let tableTypeId = newTableForm.existingTypeId;

      // Create new table type if not using existing one
      if (!newTableForm.useExistingType) {
        if (!newTableForm.typeName.trim()) {
          toast.error('Please enter a table type name');
          setLoading(false);
          return;
        }

        const { data: typeData, error: typeError } = await supabase
          .from('table_types')
          .insert([{
            name: newTableForm.typeName.trim(),
            capacity: newTableForm.capacity,
            description: newTableForm.description.trim(),
            restaurant_id: restaurant.id
          }])
          .select()
          .single();

        if (typeError) throw typeError;
        tableTypeId = typeData.id;
        setTableTypes(prev => [...prev, typeData]);
      }

      // Create tables
      const tablesToCreate = [];
      const quantity = newTableForm.quantity || 1;

      for (let i = 0; i < quantity; i++) {
        const tableNumber = quantity > 1 
          ? `${newTableForm.tableNumber}${i + 1}`
          : newTableForm.tableNumber;

        tablesToCreate.push({
          table_type_id: tableTypeId,
          table_number: tableNumber,
          position_description: newTableForm.positionDescription.trim(),
          restaurant_id: restaurant.id,
          is_available: true
        });
      }

      const { data: createdTables, error: tablesError } = await supabase
        .from('tables')
        .insert(tablesToCreate)
        .select('*, table_types(*)');

      if (tablesError) throw tablesError;

      setTables(prev => [...prev, ...createdTables]);
      
      // Reset form
      setNewTableForm({
        typeName: '',
        capacity: 2,
        description: '',
        tableNumber: '',
        quantity: 1,
        positionDescription: '',
        useExistingType: false,
        existingTypeId: ''
      });

      toast.success(`Successfully created ${quantity} table${quantity > 1 ? 's' : ''}`);
      
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error('Failed to create table');
    } finally {
      setLoading(false);
    }
  };

  // Delete table type
  const deleteTableType = async (typeId) => {
    try {
      // Check if any tables are using this type
      const { count, error: countError } = await supabase
        .from('tables')
        .select('*', { count: 'exact', head: true })
        .eq('table_type_id', typeId);

      if (countError) throw countError;

      if (count > 0) {
        toast.error('Cannot delete table type - tables are assigned to it');
        return;
      }

      const { error } = await supabase
        .from('table_types')
        .delete()
        .eq('id', typeId);

      if (error) throw error;

      setTableTypes(prev => prev.filter(type => type.id !== typeId));
      toast.success('Table type deleted successfully');

    } catch (error) {
      console.error('Error deleting table type:', error);
      toast.error('Failed to delete table type');
    }
  };

  // Delete table
  const deleteTable = async (tableId) => {
    try {
      // Check if table has reservations
      const { count, error: reservationError } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('table_id', tableId);

      if (reservationError) throw reservationError;

      if (count > 0) {
        toast.error('Cannot delete table - it has existing reservations');
        return;
      }

      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      setTables(prev => prev.filter(table => table.id !== tableId));
      toast.success('Table deleted successfully');

    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    }
  };

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
            Manage your restaurant tables. Create new tables with their types, or manage existing ones.
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveSection('create')}
          className={`flex-1 py-2 px-4 rounded-md transition-all ${
            activeSection === 'create' 
              ? 'bg-gradient-to-r from-yellow-400 to-pink-600 text-white' 
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Create Tables
        </button>
        <button
          onClick={() => setActiveSection('manage')}
          className={`flex-1 py-2 px-4 rounded-md transition-all ${
            activeSection === 'manage' 
              ? 'bg-gradient-to-r from-yellow-400 to-pink-600 text-white' 
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Manage Existing
        </button>
      </div>

      {/* Create Tables Section */}
      {activeSection === 'create' && (
        <div className="space-y-6">
          {/* Use Existing Type Toggle */}
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={newTableForm.useExistingType}
                  onChange={(e) => setNewTableForm({
                    ...newTableForm,
                    useExistingType: e.target.checked,
                    existingTypeId: e.target.checked ? (tableTypes[0]?.id || '') : ''
                  })}
                  className="sr-only"
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${
                  newTableForm.useExistingType ? 'bg-yellow-500' : 'bg-gray-600'
                }`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  newTableForm.useExistingType ? 'transform translate-x-4' : ''
                }`}></div>
              </div>
            </label>
            <span className="text-gray-300">Use existing table type</span>
          </div>

          {/* Table Type Selection/Creation */}
          {newTableForm.useExistingType ? (
            <div className="bg-gray-800 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Table Type
              </label>
              <select
                value={newTableForm.existingTypeId}
                onChange={(e) => setNewTableForm({ ...newTableForm, existingTypeId: e.target.value })}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="">Choose a table type...</option>
                {tableTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.capacity} seats)
                  </option>
                ))}
              </select>
              {tableTypes.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  No table types available. Please create a new table type first.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 p-4 rounded-lg space-y-4">
              <h4 className="font-semibold text-gray-300">New Table Type</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2-Seater, VIP Booth, Family Table"
                    value={newTableForm.typeName}
                    onChange={(e) => setNewTableForm({ ...newTableForm, typeName: e.target.value })}
                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newTableForm.capacity}
                    onChange={(e) => setNewTableForm({ ...newTableForm, capacity: parseInt(e.target.value) || 1 })}
                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Brief description of this table type..."
                  value={newTableForm.description}
                  onChange={(e) => setNewTableForm({ ...newTableForm, description: e.target.value })}
                  rows="2"
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Table Details */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-4">
            <h4 className="font-semibold text-gray-300">Table Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Table Number/Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., 1, A1, Window Table"
                  value={newTableForm.tableNumber}
                  onChange={(e) => setNewTableForm({ ...newTableForm, tableNumber: e.target.value })}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTableForm.quantity}
                  onChange={(e) => setNewTableForm({ ...newTableForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Create multiple tables of this type (will be numbered sequentially)
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Position Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Near window, Corner spot, Main hall"
                value={newTableForm.positionDescription}
                onChange={(e) => setNewTableForm({ ...newTableForm, positionDescription: e.target.value })}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={createTableWithType}
            disabled={loading || !newTableForm.tableNumber || 
              (!newTableForm.useExistingType && !newTableForm.typeName) ||
              (newTableForm.useExistingType && !newTableForm.existingTypeId)}
            className="w-full bg-gradient-to-r from-yellow-400 to-pink-600 py-3 px-6 rounded-lg hover:opacity-90 transition-all text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : `Create ${newTableForm.quantity > 1 ? `${newTableForm.quantity} Tables` : 'Table'}`}
          </button>
        </div>
      )}

      {/* Manage Existing Section */}
      {activeSection === 'manage' && (
        <div className="space-y-6">
          {/* Table Types Management */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-300 mb-4">Table Types</h4>
            {tableTypes.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No table types defined yet</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {tableTypes.map(type => {
                  const tablesOfThisType = tables.filter(table => table.table_type_id === type.id);
                  return (
                    <div key={type.id} className="bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-white">{type.name}</span>
                          <span className="text-sm text-gray-400 ml-2">
                            ({type.capacity} seats)
                          </span>
                          {type.description && (
                            <p className="text-sm text-gray-400 mt-1">{type.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTableType(type.id)}
                          disabled={tablesOfThisType.length > 0}
                          className="text-red-400 hover:text-red-300 text-sm disabled:text-gray-600 disabled:cursor-not-allowed"
                          title={tablesOfThisType.length > 0 ? 'Cannot delete - tables are assigned' : 'Delete table type'}
                        >
                          Delete
                        </button>
                      </div>
                      <div className="text-xs text-gray-400">
                        {tablesOfThisType.length} table{tablesOfThisType.length !== 1 ? 's' : ''} of this type
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tables Management */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-300 mb-4">All Tables</h4>
            {tables.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No tables added yet</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {tables.map(table => (
                  <div key={table.id} className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-white">{table.table_number}</span>
                        <span className="text-sm text-gray-400 ml-2">
                          ({table.table_types.name}, {table.table_types.capacity} seats)
                        </span>
                        {table.position_description && (
                          <p className="text-sm text-gray-400 mt-1">{table.position_description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTable(table.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;