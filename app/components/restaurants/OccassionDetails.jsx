import { useState } from "react";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { FiChevronDown } from "react-icons/fi";
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
  };

  return (
    <div>
      <div className="flex flex-col">
        <div className="flex space-x-2 relative">
          {/* Country Code Dropdown */}
          <div className="relative w-28">
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
              <FiChevronDown className="ml-1" />
            </button>

            {/* Dropdown Menu */}
            {isCountryDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-gray-800 border border-gray-600 rounded-md shadow-lg">
                {countryCodes.map((country) => (
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
                    <span className="text-white">
                      {country.code} {country.name}
                    </span>
                  </div>
                ))}
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
          className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400"
        />
      </div>
    </div>
  );
};

export default OccasionDetails;