'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const TableAssignmentManager = ({ restaurant, onUpdate }) => {
  const [assignmentMode, setAssignmentMode] = useState('automatic');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);

  useEffect(() => {
    if (restaurant) {
      setAssignmentMode(restaurant.table_assignment_mode || 'automatic');
    }
  }, [restaurant]);

  const handleModeChange = (mode) => {
    if (mode === assignmentMode) return;
    
    setPendingMode(mode);
    setShowConfirmation(true);
  };

  const confirmModeChange = async () => {
    if (!restaurant || !pendingMode) return;
    
    setLoading(true);
    setShowConfirmation(false);
    
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ table_assignment_mode: pendingMode })
        .eq('id', restaurant.id);

      if (error) throw error;

      setAssignmentMode(pendingMode);
      if (onUpdate) onUpdate();
      
      toast.success(`Table assignment mode set to ${pendingMode === 'automatic' ? 'Automatic' : 'Manual'}`);
    } catch (error) {
      console.error('Error updating assignment mode:', error);
      toast.error('Failed to update assignment mode');
    } finally {
      setLoading(false);
      setPendingMode(null);
    }
  };

  const cancelModeChange = () => {
    setShowConfirmation(false);
    setPendingMode(null);
  };

  return (
    <>
      <div className="bg-gray-700/50 p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-bold text-yellow-400">Table Assignment Mode</h3>
          <div className="group relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute hidden group-hover:block bottom-full mb-2 w-80 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg z-10">
              <p className="font-semibold mb-2">Automatic Mode:</p>
              <p className="mb-2">Customers choose their preferred table during booking</p>
              <p className="font-semibold mb-2">Manual Mode:</p>
              <p>Customers only specify party size. Restaurant staff assigns tables later in the admin panel.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Automatic Mode Card */}
          <div 
            className={`p-6 rounded-lg cursor-pointer transition-all ${
              assignmentMode === 'automatic' 
                ? 'bg-yellow-500/20 border-2 border-yellow-500' 
                : 'bg-gray-800/50 border border-gray-600 hover:bg-gray-700/50'
            }`}
            onClick={() => !loading && handleModeChange('automatic')}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg">Automatic Assignment</h4>
              {assignmentMode === 'automatic' && (
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Customers choose their preferred table during the booking process. 
              Best for restaurants where table selection is important to guests.
            </p>
            <div className="bg-gray-700/50 p-3 rounded">
              <p className="text-xs text-gray-400">
                ✓ Customers see available tables<br/>
                ✓ Real-time table availability<br/>
                ✓ Guests choose their preferred spot
              </p>
            </div>
          </div>

          {/* Manual Mode Card */}
          <div 
            className={`p-6 rounded-lg cursor-pointer transition-all ${
              assignmentMode === 'manual' 
                ? 'bg-blue-500/20 border-2 border-blue-500' 
                : 'bg-gray-800/50 border border-gray-600 hover:bg-gray-700/50'
            }`}
            onClick={() => !loading && handleModeChange('manual')}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg">Manual Assignment</h4>
              {assignmentMode === 'manual' && (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Staff assigns tables after bookings are made. 
              Best for restaurants that prefer to manage seating arrangements.
            </p>
            <div className="bg-gray-700/50 p-3 rounded">
              <p className="text-xs text-gray-400">
                ✓ Staff control table assignments<br/>
                ✓ Flexible seating arrangements<br/>
                ✓ Better for large groups/events
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-300">
            Current mode: <span className="font-medium capitalize">{assignmentMode}</span>
          </p>
          {assignmentMode === 'automatic' && (
            <p className="text-xs text-gray-400 mt-1">
              Customers will select tables during booking. Make sure your table setup is current.
            </p>
          )}
          {assignmentMode === 'manual' && (
            <p className="text-xs text-gray-400 mt-1">
              You will need to assign tables manually in the reservations management section.
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">Confirm Mode Change</DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to change the table assignment mode from{' '}
              <span className="font-semibold capitalize">{assignmentMode}</span> to{' '}
              <span className="font-semibold capitalize">{pendingMode}</span>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-200 mb-2">What will change:</h4>
            {pendingMode === 'automatic' ? (
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Customers will see and select tables during booking</li>
                <li>• Real-time table availability will be shown</li>
                <li>• Guests can choose their preferred seating</li>
              </ul>
            ) : (
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Customers will only specify party size</li>
                <li>• You'll need to manually assign tables in the admin panel</li>
                <li>• More flexibility for staff seating arrangements</li>
              </ul>
            )}
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={cancelModeChange}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmModeChange}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TableAssignmentManager;