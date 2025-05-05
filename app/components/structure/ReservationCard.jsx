import { motion } from 'framer-motion';
import { Check, Eye, EyeOff, X } from 'lucide-react';

const ReservationCard = ({ res, markAsSeen, cancelReservation, highlightCurrent = false, isPast = false }) => {
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

    // Status indicator colors
    const statusColors = {
      new: 'bg-blue-500 text-white',
      current: 'bg-green-500 text-white',
      past: 'bg-gray-500 text-white',
      cancelled: 'bg-red-500 text-white',
      seen: 'bg-purple-500 text-white'
    };

    // Base card classes
    const cardClasses = `p-6 rounded-xl shadow-xl relative overflow-hidden transition-all duration-300 ${
      res.cancelled ? 'bg-gray-800/40 border-l-4 border-red-500/80' :
      !res.seen ? 'border-l-4 border-blue-500 bg-gray-700' : 
      highlightCurrent ? 'bg-gradient-to-r from-green-900/30 to-gray-700 border-l-4 border-green-500' :
      isPast ? 'bg-gray-700/40' : 'bg-gray-700'
    }`;

    // Text color based on status
    const textColor = res.cancelled ? 'text-gray-400' : 
                     !res.seen ? 'text-white' : 
                     highlightCurrent ? 'text-white' : 
                     isPast ? 'text-gray-400' : 'text-white';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cardClasses}
      >
        {/* Status badges - top right */}
        <div className="absolute top-2 right-2 flex gap-2">
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

          {res.cancelled && (
            <span className={`flex items-center gap-1 ${statusColors.cancelled} text-xs px-2 py-1 rounded-full`}>
              <X className="h-3 w-3" /> Cancelled
            </span>
          )}

          {highlightCurrent && !res.cancelled && (
            <span className={`${statusColors.current} text-xs px-2 py-1 rounded-full`}>
              {timeStatus}
            </span>
          )}
        </div>

        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`text-xl font-bold ${textColor} ${res.cancelled ? 'line-through' : ''}`}>
                {res.name}
                {!res.seen && !res.cancelled && <span className="ml-1 animate-pulse">✨</span>}
              </h3>
              
              {!highlightCurrent && !res.cancelled && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isPast ? 'bg-gray-700 text-gray-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
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
                    day: 'numeric' 
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
              <div className={`mt-3 pt-3 border-t ${res.cancelled ? 'border-gray-700' : 'border-gray-600'}`}>
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
                  onClick={() => cancelReservation(res.id)}
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
    );
};

export default ReservationCard;