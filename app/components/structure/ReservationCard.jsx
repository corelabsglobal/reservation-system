import { motion, AnimatePresence } from 'framer-motion';
import { Check, Eye, EyeOff, X, AlertTriangle, UserCheck, Clock, Calendar, Users, Table, Phone, Move } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TableAssignmentModal from './TableAssignmentModal';

const ReservationCard = ({ 
  res, 
  cancelReservation, 
  markAsAttended, 
  highlightCurrent = false, 
  isPast = false,
  tables = [],
  tableTypes = [],
  onReservationUpdate 
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const formatPhoneNumber = (phone) => {
    if (!phone && phone !== 0) return 'N/A';
    
    const phoneStr = typeof phone === 'number' ? phone.toString() : String(phone);
    
    const cleaned = phoneStr.replace(/[^\d+]/g, '')
      .replace(/^\+233/, '')
      .replace(/^233/, '');
      
    return cleaned.startsWith('0') ? cleaned : `0${cleaned}`;
  };

  const formattedPhone = formatPhoneNumber(res.number);

  const reservationTime = new Date(`${res.date}T${res.time}`);
  const now = new Date();
  const timeDiff = reservationTime - now;
  const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  let timeStatus = '';
  if (res.cancelled) {
    timeStatus = 'Cancelled';
  } else if (reservationTime < now) {
    timeStatus = 'Past';
  } else if (hoursDiff > 0) {
    timeStatus = `${hoursDiff}h ${minutesDiff}m`;
  } else if (minutesDiff > 0) {
    timeStatus = `${minutesDiff}m`;
  } else {
    timeStatus = 'Now';
  }

  const isFutureReservation = reservationTime > now && !res.cancelled;

  const handleCancelClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelReservation(res.id);
    } finally {
      setIsCancelling(false);
      setShowConfirmModal(false);
    }
  };

  const handleMarkAsAttended = async () => {
    try {
      await markAsAttended(res.id);
    } catch (error) {
      console.error('Error in handleMarkAsAttended:', error);
      toast.error(error.message || 'Failed to update attendance status');
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Simplified table assignment handler
  const handleTableAssignmentClick = async () => {
    if (!isFutureReservation) {
      toast.error('Cannot modify past reservations');
      return;
    }
    setShowTableModal(true);
  };

  // Status indicator colors
  const statusColors = {
    new: 'bg-blue-500 text-white',
    current: 'bg-green-500 text-white',
    past: 'bg-gray-500 text-white',
    cancelled: 'bg-red-500 text-white',
    attended: 'bg-teal-500 text-white',
  };

  // Base card classes
  const cardClasses = `p-4 rounded-xl shadow-sm relative overflow-hidden transition-all duration-200 ${
    res.cancelled
      ? 'border-l-4 border-blue-400 bg-white'
      : res.attended
      ? 'border-l-4 border-teal-400 bg-white'
      : highlightCurrent
      ? 'bg-gradient-to-r from-green-50 to-white border-l-4 border-green-400'
      : isPast
      ? 'bg-gray-50'
      : 'bg-white'
  }`;

  // Text color based on status
  const textColor = res.cancelled
    ? 'text-gray-500'
    : !res.seen
    ? 'text-gray-800'
    : highlightCurrent
    ? 'text-gray-800'
    : isPast
    ? 'text-gray-500'
    : 'text-gray-800';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cardClasses}
      >
        {/* Main content area - unchanged */}
        <div className="flex flex-col">
          {/* Header section */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className={`text-lg font-semibold truncate ${textColor} ${
                    res.cancelled ? 'line-through' : ''
                  }`}
                >
                  {res.name}
                  {!res.cancelled && (
                    <span className="ml-1 text-blue-500 animate-pulse">•</span>
                  )}
                </h3>
              </div>
              
              {/* Phone number display */}
              <div className="flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">{formattedPhone}</span>
              </div>
              
              {/* Time status badge */}
              <div className="mt-1 flex items-center gap-2">
                {!res.cancelled && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      isPast
                        ? 'bg-gray-200 text-gray-600'
                        : highlightCurrent
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {timeStatus}
                  </span>
                )}
                
                {res.cancelled && (
                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    <X className="h-3 w-3" /> Cancelled
                  </span>
                )}
              </div>
            </div>
            
            {/* Status badges - top right */}
            <div className="flex flex-col items-end gap-1">
              {!res.cancelled && (
                <span className={`inline-flex items-center gap-1 ${statusColors.new} text-xs px-2 py-1 rounded-full`}>
                  <Eye className="h-3 w-3" /> New
                </span>
              )}

              {!res.attended && !res.cancelled && (
                <span className={`inline-flex items-center gap-1 ${statusColors.seen} text-xs px-2 py-1 rounded-full`}>
                  <Check className="h-3 w-3" /> Viewed
                </span>
              )}

              {res.attended && !res.cancelled && (
                <span className={`inline-flex items-center gap-1 ${statusColors.attended} text-xs px-2 py-1 rounded-full`}>
                  <UserCheck className="h-3 w-3" /> Attended
                </span>
              )}
            </div>
          </div>

          {/* Details section */}
          <div className={`mt-3 ${res.cancelled ? 'opacity-80' : ''}`}>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className={`text-sm ${textColor}`}>
                    {new Date(res.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className={`text-sm ${textColor}`}>{res.time}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Guests</p>
                  <p className={`text-sm ${textColor}`}>{res.people}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Table className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Table</p>
                  <p className={`text-sm ${textColor}`}>
                    {res.table_number || 'Not assigned'}
                    {isFutureReservation && (
                      <button 
                        onClick={handleTableAssignmentClick}
                        className="ml-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        {res.table_number ? '(Change)' : '(Assign)'}
                      </button>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {(res.special_request || res.occassion) && (
              <button 
                onClick={toggleExpand}
                className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                {expanded ? 'Show less' : 'Show more details'}
                <motion.span
                  animate={{ rotate: expanded ? 180 : 0 }}
                  className="ml-1"
                >
                  ▼
                </motion.span>
              </button>
            )}

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {res.special_request && (
                    <div className={`mt-3 pt-3 border-t border-gray-200`}>
                      <p className="text-xs text-gray-500">Special Request</p>
                      <p className={`text-sm ${textColor} mt-1`}>{res.special_request}</p>
                    </div>
                  )}

                  {res.occassion && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">Occasion</p>
                      <p className={`text-sm ${textColor} mt-1`}>{res.occassion}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          {!res.cancelled && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleMarkAsAttended}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                  res.attended
                    ? 'bg-teal-100 hover:bg-teal-200 text-teal-800'
                    : 'bg-teal-100 hover:bg-teal-200 text-teal-800'
                }`}
              >
                {res.attended ? (
                  <>
                    <UserCheck className="h-4 w-4" /> Unmark
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" /> Attended
                  </>
                )}
              </button>

              {/* Table Assignment Button */}
              {isFutureReservation && (
                <button
                  onClick={handleTableAssignmentClick}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-1 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm transition-all"
                >
                  <Move className="h-4 w-4" /> Table
                </button>
              )}
              
              <button
                onClick={handleCancelClick}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm transition-all"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Cancel Reservation Modal - unchanged */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <DialogTitle>Confirm Cancellation</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this reservation for {res.name}?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isCancelling}
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" /> Cancel Reservation
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TableAssignmentModal
        reservation={res}
        tables={tables}
        tableTypes={tableTypes}
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onReservationUpdate={onReservationUpdate}
        isFutureReservation={isFutureReservation}
      />
    </>
  );
};

export default ReservationCard;