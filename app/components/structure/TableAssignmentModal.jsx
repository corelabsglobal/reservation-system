import { useState, useEffect } from 'react';
import { Move, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const TableAssignmentModal = ({ 
  reservation, 
  tables = [], 
  tableTypes = [], 
  isOpen, 
  onClose,
  onReservationUpdate,
  isFutureReservation 
}) => {
  const [availableTables, setAvailableTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [movingTable, setMovingTable] = useState(false);

  const fetchAvailableTables = async () => {
    if (!reservation.restaurant_id) {
      toast.error('Restaurant information not available');
      return;
    }

    setLoadingTables(true);
    try {
      // Get tables that can accommodate the reservation's party size
      const suitableTables = tables.filter(table => {
        const tableType = tableTypes.find(type => type.id === table.table_type_id);
        return tableType && tableType.capacity >= reservation.people;
      });

      // Check which of these tables are available at the reservation time
      const { data: conflictingReservations, error } = await supabase
        .from('reservations')
        .select('table_id')
        .eq('restaurant_id', reservation.restaurant_id)
        .eq('date', reservation.date)
        .eq('time', reservation.time)
        .eq('cancelled', false);

      if (error) throw error;

      const conflictingTableIds = conflictingReservations.map(reservation => reservation.table_id);
      // Exclude the current table (if already assigned) from conflicting tables
      const filteredConflictingTableIds = conflictingTableIds.filter(
        tableId => tableId !== reservation.table_id
      );
      
      const trulyAvailableTables = suitableTables.filter(
        table => !filteredConflictingTableIds.includes(table.id)
      );

      setAvailableTables(trulyAvailableTables);
    } catch (error) {
      console.error('Error fetching available tables:', error);
      toast.error('Failed to load available tables');
    } finally {
      setLoadingTables(false);
    }
  };

  const handleMoveReservation = async (newTableId) => {
    if (!isFutureReservation) {
      toast.error('Cannot modify past reservations');
      return;
    }

    setMovingTable(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ table_id: newTableId })
        .eq('id', reservation.id);

      if (error) throw error;

      const newTable = tables.find(t => t.id === newTableId);
      toast.success(`Reservation moved to Table ${newTable?.table_number}`);
      
      const updatedReservation = {
        ...reservation,
        table_id: newTableId,
        table_number: newTable?.table_number,
        tables: { table_number: newTable?.table_number }
      };
      
      if (onReservationUpdate) {
        onReservationUpdate(updatedReservation);
      }
      
      onClose();
    } catch (error) {
      console.error('Error moving reservation:', error);
      toast.error('Failed to move reservation');
    } finally {
      setMovingTable(false);
    }
  };

  const clearTableAssignment = async () => {
    if (!isFutureReservation) {
      toast.error('Cannot modify past reservations');
      return;
    }

    setMovingTable(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ table_id: null })
        .eq('id', reservation.id);

      if (error) throw error;

      toast.success('Table assignment cleared');
      
      const updatedReservation = {
        ...reservation,
        table_id: null,
        table_number: null,
        tables: null
      };
      
      if (onReservationUpdate) {
        onReservationUpdate(updatedReservation);
      }
      
      onClose();
    } catch (error) {
      console.error('Error clearing table assignment:', error);
      toast.error('Failed to clear table assignment');
    } finally {
      setMovingTable(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAvailableTables();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <Move className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <DialogTitle>Manage Table Assignment</DialogTitle>
              <DialogDescription>
                Assign or change table for {reservation.name} ({reservation.people} people) on {reservation.date} at {reservation.time}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current Assignment */}
        {reservation.table_id && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">Current Assignment</h4>
            <p className="text-blue-700">
              Table {reservation.table_number}
              {isFutureReservation && (
                <button 
                  onClick={clearTableAssignment}
                  disabled={movingTable}
                  className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                >
                  (Clear Assignment)
                </button>
              )}
            </p>
          </div>
        )}

        {/* Available Tables */}
        <div className="mt-4">
          <h4 className="font-semibold mb-3 text-gray-700">Available Tables</h4>
          
          {loadingTables ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
            </div>
          ) : availableTables.length === 0 ? (
            <p className="text-gray-500 py-4 text-center">No available tables for this time slot</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {availableTables.map(table => {
                const tableType = tableTypes.find(type => type.id === table.table_type_id);
                return (
                  <div 
                    key={table.id} 
                    className="p-3 rounded bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer border border-gray-200"
                    onClick={() => handleMoveReservation(table.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Table {table.table_number}</p>
                        <p className="text-sm text-gray-600">
                          {tableType?.name} ({tableType?.capacity} seats)
                        </p>
                        {table.position_description && (
                          <p className="text-xs text-gray-500 mt-1">{table.position_description}</p>
                        )}
                      </div>
                      <button 
                        className="bg-gradient-to-r from-orange-400 to-pink-600 px-3 py-1 rounded text-sm whitespace-nowrap text-white font-medium"
                        disabled={movingTable}
                      >
                        {movingTable ? 'Moving...' : 'Assign'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={movingTable}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TableAssignmentModal;