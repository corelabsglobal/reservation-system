'use client';

const PaymentRequiredModal = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-10 w-10 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Reservations Temporarily Unavailable
          </h2>

          <p className="text-gray-600 mb-6">
            Reservations for this restaurant are currently unavailable while we complete a routine service update.
          </p>

          <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
            <div className="flex items-start gap-3">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Service Update in Progress</p>
                <p className="text-sm text-gray-600 mt-1">
                  The restaurant is completing a brief account update to restore full reservation access.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Please check back shortly or contact the restaurant for immediate assistance.
          </p>
                    
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
          >
            Return to Homepage
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Please check back later or contact the restaurant directly.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentRequiredModal;