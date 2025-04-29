import React from "react";
import toast from "react-hot-toast";

export default function CopyArea({ restaurantUrl }) {
  const fullUrl = `https://www.danloski.com/${restaurantUrl}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    toast.success("Restaurant URL copied successfully");
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-4 mb-2">
      <span className="text-gray-300 whitespace-nowrap">Restaurant URL:</span>
      <div className="relative flex-1 sm:w-auto sm:max-w-md">
        <div className="flex items-center bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600 w-full">
          <div className="overflow-x-auto scrollbar-hide py-2 px-3 whitespace-nowrap flex-1">
            <span className="text-indigo-300">{fullUrl}</span>
          </div>
        </div>
        <button 
          onClick={handleCopy}
          className="absolute right-0 sm:right-[-2.5rem] top-1/2 transform -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-gray-600 hover:bg-gray-500 transition-colors rounded-lg ml-2"
          aria-label="Copy URL"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        </button>
      </div>
    </div>
  );
}