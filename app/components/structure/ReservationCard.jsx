import { motion, AnimatePresence } from 'framer-motion';
import { Check, Eye, EyeOff, X, AlertTriangle, UserCheck } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const ReservationCard = ({ res, markAsSeen, cancelReservation, markAsAttended, highlightCurrent = false, isPast = false }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

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
    timeStatus = `In ${hoursDiff}h ${minutesDiff}m`;
  } else if (minutesDiff > 0) {
    timeStatus = `In ${minutesDiff}m`;
  } else {
    timeStatus = 'Now';
  }

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

  // Status indicator colors
  const statusColors = {
    new: 'bg-blue-500 text-white',
    current: 'bg-green-500 text-white',
    past: 'bg-gray-500 text-white',
    cancelled: 'bg-red-500 text-white',
    seen: 'bg-purple-500 text-white',
    attended: 'bg-teal-500 text-white',
  };

  // Base card classes
  const cardClasses = `p-6 rounded-xl shadow-xl relative overflow-hidden transition-all duration-300 ${
    res.cancelled
      ? 'bg-gray-800/40 border-l-4 border-red-500/80'
      : !res.seen
      ? 'border-l-4 border-blue-500 bg-gray-700'
      : res.attended
      ? 'border-l-4 border-teal-500 bg-gray-700'
      : highlightCurrent
      ? 'bg-gradient-to-r from-green-900/30 to-gray-700 border-l-4 border-green-500'
      : isPast
      ? 'bg-gray-700/40'
      : 'bg-gray-700'
  }`;

  // Text color based on status
  const textColor = res.cancelled
    ? 'text-gray-400'
    : !res.seen
    ? 'text-white'
    : highlightCurrent
    ? 'text-white'
    : isPast
    ? 'text-gray-400'
    : 'text-white';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cardClasses}
      >
        {/* Status badges - top right */}
        <div className="absolute top-2 right-2 flex flex-wrap gap-2">
          {!res.seen && !res.cancelled && (
            <span className={`flex items-center gap-1 ${statusColors.new} text-xs px-2 py-1 rounded-full`}>
              <Eye className="h-3 w-3" /> New
            </span>
          )}

          {res.seen && !res.cancelled && (
            <span className={`flex items-center gap-1 ${statusColors.seen} text-xs px-2 py-1 rounded-full`}>
              <Check className="h-3 w-3" /> Viewed
            </span>
          )}

          {res.attended && !res.cancelled && (
            <span className={`flex items-center gap-1 ${statusColors.attended} text-xs px-2 py-1 rounded-full`}>
              <UserCheck className="h-3 w-3" /> Attended
            </span>
          )}

          {res.cancelled && (
            <span className={`flex items-center gap-1 ${statusColors.cancelled} text-xs px-2 py-1 rounded-full`}>
              <X className="h-3 w-3" /> Cancelled
            </span>
          )}

          {highlightCurrent && !res.cancelled && (
            <span className={`${statusColors.current} text-xs px-2 py-1 rounded-full`}>{timeStatus}</span>
          )}
        </div>

        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3
                className={`text-xl font-bold ${textColor} ${res.cancelled ? 'line-through' : ''}`}
              >
                {res.name}
                {!res.seen && !res.cancelled && <span className="ml-1 animate-pulse">✨</span>}
              </h3>

              {!highlightCurrent && !res.cancelled && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isPast ? 'bg-gray-700 text-gray-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {timeStatus}
                </span>
              )}
            </div>

            <div className={`grid grid-cols-2 gap-2 mt-2 ${res.cancelled ? 'opacity-80' : ''}`}>
              <div>
                <p className="text-sm text-gray-400">Date</p>
                <p className={textColor}>
                  {new Date(res.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Time</p>
                <p className={textColor}>{res.time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Guests</p>
                <p className={textColor}>{res.people}</p>
              </div>
              {res.table_number && (
                <div>
                  <p className="text-sm text-gray-400">Table</p>
                  <p className={textColor}>{res.table_number}</p>
                </div>
              )}
            </div>

            {res.special_request && (
              <div
                className={`mt-3 pt-3 border-t ${res.cancelled ? 'border-gray-700' : 'border-gray-600'}`}
              >
                <p className="text-sm text-gray-400">Special Request</p>
                <p className={textColor}>{res.special_request}</p>
              </div>
            )}

            {res.occassion && (
              <div className="mt-2">
                <p className="text-sm text-gray-400">Occasion</p>
                <p className={textColor}>{res.occassion}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 min-w-[100px]">
            {!res.cancelled && (
              <>
                <button
                  onClick={() => markAsSeen(res.id)}
                  className={`flex items-center justify-center gap-1 px-3 py-1 rounded-md text-sm transition-all whitespace-nowrap ${
                    res.seen
                      ? 'bg-purple-600/50 hover:bg-purple-600/70 text-purple-100'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {res.seen ? (
                    <>
                      <EyeOff className="h-4 w-4" /> Unmark
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" /> Seen
                    </>
                  )}
                </button>
                <button
                  onClick={handleMarkAsAttended}
                  className={`flex items-center justify-center gap-1 px-3 py-1 rounded-md text-sm transition-all whitespace-nowrap ${
                    res.attended
                      ? 'bg-teal-600/50 hover:bg-teal-600/70 text-teal-100'
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
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
                <button
                  onClick={handleCancelClick}
                  className="flex items-center justify-center gap-1 px-3 py-1 bg-red-500/90 hover:bg-red-600 text-white rounded-md text-sm transition-all"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {res.cancelled && (
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-900/50 rounded-xl pointer-events-none" />
        )}
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Confirm Cancellation</h3>
                  <p className="text-gray-400 mt-1">
                    Are you sure you want to cancel this reservation for {res.name}?
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-70"
                >
                  {isCancelling ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
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
                      <X className="h-5 w-5" /> Yes, Cancel
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ReservationCard;