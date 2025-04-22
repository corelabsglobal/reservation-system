import { motion } from 'framer-motion';

const ReservationCard = ({ res, markAsSeen, cancelReservation, highlightCurrent = false, isPast = false }) => {
    const reservationTime = new Date(`${res.date}T${res.time}`);
    const now = new Date();
    const timeDiff = reservationTime - now;
    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
    let timeStatus = '';
    if (reservationTime < now) {
      timeStatus = 'Past';
    } else if (hoursDiff > 0) {
      timeStatus = `In ${hoursDiff}h ${minutesDiff}m`;
    } else if (minutesDiff > 0) {
      timeStatus = `In ${minutesDiff}m`;
    } else {
      timeStatus = 'Now';
    }
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`p-6 rounded-xl shadow-xl relative overflow-hidden ${
          res.is_new ? 'border-l-4 border-blue-500 bg-gray-700' : 
          highlightCurrent ? 'bg-gradient-to-r from-green-900/50 to-gray-700 border-l-4 border-green-500' :
          isPast ? 'bg-gray-700/30' : 'bg-gray-700'
        }`}
      >
        {res.is_new && (
          <span className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            New
          </span>
        )}
        
        {highlightCurrent && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            {timeStatus}
          </div>
        )}
  
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-bold ${
                res.is_new ? 'text-white' : 
                highlightCurrent ? 'text-white' : 
                isPast ? 'text-gray-400' : 'text-white'
              }`}>
                {res.name}
                {res.is_new && <span className="ml-2 animate-pulse">✨</span>}
              </h3>
              {!highlightCurrent && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isPast ? 'bg-gray-700 text-gray-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {timeStatus}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-sm text-gray-400">Date</p>
                <p>{new Date(res.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Time</p>
                <p>{res.time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Guests</p>
                <p>{res.people}</p>
              </div>
              {res.table_number && (
                <div>
                  <p className="text-sm text-gray-400">Table</p>
                  <p>{res.table_number}</p>
                </div>
              )}
            </div>
            
            {res.special_request && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <p className="text-sm text-gray-400">Special Request</p>
                <p className="text-white">{res.special_request}</p>
              </div>
            )}
            {res.occassion && (
              <div className="mt-2">
                <p className="text-sm text-gray-400">Occasion</p>
                <p className="text-white">{res.occassion}</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={() => markAsSeen(res.id)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm transition-all whitespace-nowrap"
            >
              Mark Seen
            </button>
            <button
              onClick={() => cancelReservation(res.id)}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    );
};

export default ReservationCard;