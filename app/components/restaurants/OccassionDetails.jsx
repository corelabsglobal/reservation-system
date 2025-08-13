import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import { countryCodes } from "../structure/CountryCodes";

const OccasionDetails = ({ onChange }) => {
  const [occasion, setOccasion] = useState("");
  const [number, setNumber] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [selectedCountry, setSelectedCountry] = useState({
    code: "+233",
    name: "Ghana"
  });
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Filter countries based on search term
  const filteredCountries = countryCodes.filter(country => 
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    country.code.includes(searchTerm)
  );

  const handleOccasionChange = (e) => {
    setOccasion(e.target.value);
    onChange({ occasion: e.target.value, number, specialRequest });
  };

  const handleNumberChange = (e) => {
    setNumber(e.target.value);
    onChange({ occasion, number: e.target.value, specialRequest });
  };

  const handleSpecialRequestChange = (e) => {
    setSpecialRequest(e.target.value);
    onChange({ occasion, number, specialRequest: e.target.value });
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsCountryDropdownOpen(false);
    setSearchTerm(""); // Clear search when a country is selected
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col">
        <div className="flex space-x-2 relative">
          {/* Country Code Dropdown */}
          <div className="relative w-28" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className="flex items-center justify-between bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 w-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <div className="flex items-center">
                {selectedCountry.code === "+233" && (
                  <Image
                    src="/ghana-flag.jpg"
                    alt="Ghana Flag"
                    width={20}
                    height={15}
                    className="mr-1"
                  />
                )}
                <span className="text-md">{selectedCountry.code}</span>
              </div>
              <FiChevronDown 
                className={`ml-1 transition-transform duration-200 ${
                  isCountryDropdownOpen ? "rotate-180" : ""
                }`} 
              />
            </button>

            {/* Dropdown Menu */}
            {isCountryDropdownOpen && (
              <div className="absolute z-20 mt-1 w-64 max-h-60 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
                {/* Search Input */}
                <div className="sticky top-0 bg-gray-800 p-2 border-b border-gray-700">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-gray-700 text-white pl-10 pr-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Country List */}
                <div className="overflow-y-auto max-h-48 custom-scrollbar">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <div
                        key={country.code}
                        onClick={() => handleCountrySelect(country)}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-700 flex items-center ${
                          selectedCountry.code === country.code ? "bg-gray-700" : ""
                        }`}
                      >
                        {country.code === "+233" && (
                          <Image
                            src="/ghana-flag.jpg"
                            alt="Ghana Flag"
                            width={20}
                            height={15}
                            className="mr-2"
                          />
                        )}
                        <div>
                          <div className="text-white font-medium">{country.name}</div>
                          <div className="text-gray-400 text-sm">{country.code}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-400 text-center">No countries found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <input
            type="tel"
            placeholder="Enter Phone Number"
            value={number}
            onChange={handleNumberChange}
            className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400 flex-1 outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col mt-3">
        <Label className="mb-2">Occasion</Label>
        <input
          type="text"
          placeholder="e.g., Birthday, Anniversary"
          value={occasion}
          onChange={handleOccasionChange}
          className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400"
        />
      </div>
      <div className="flex flex-col mt-3">
        <Label className="mb-2">Special Requests</Label>
        <textarea
          type="text"
          placeholder="Any special requests?"
          value={specialRequest}
          onChange={handleSpecialRequestChange}
          className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400 min-h-[100px]"
        />
      </div>

      {/* Custom scrollbar styling */}
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 #1f2937;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default OccasionDetails;