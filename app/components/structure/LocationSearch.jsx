"use client";

import { useState, useEffect } from "react";
import countriesData from "../../../components/data/countries.json";

export const LocationSearch = ({ value, onChange, register, errors }) => {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (searchTerm.length > 1) {
      const results = [];
      
      countriesData.forEach(country => {
        if (country.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            type: "country",
            name: country.name,
            code: country.code,
            fullText: country.name
          });
        }

        if (country.code === "GH" && country.regions) {
          country.regions.forEach(region => {
            if (region.name.toLowerCase().includes(searchTerm.toLowerCase())) {
              results.push({
                type: "region",
                name: region.name,
                country: country.name,
                fullText: `${region.name}, ${country.name}`
              });
            }

            if (region.locations) {
              region.locations.forEach(location => {
                if (location.toLowerCase().includes(searchTerm.toLowerCase())) {
                  results.push({
                    type: "location",
                    name: location,
                    region: region.name,
                    country: country.name,
                    fullText: `${location}, ${region.name}, ${country.name}`
                  });
                }
              });
            }
          });
        }
      });

      setSuggestions(results.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleSelect = (suggestion) => {
    onChange(suggestion.fullText);
    setSearchTerm(suggestion.fullText);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <input
        {...register("location")}
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="Search country, region or city..."
        className="w-full text-sm sm:text-base py-2 sm:py-1 px-3 sm:px-4 border rounded-md"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onMouseDown={() => handleSelect(suggestion)}
            >
              <div className="font-medium">{suggestion.name}</div>
              <div className="text-xs text-gray-500">
                {suggestion.type === "location" && `${suggestion.region}, ${suggestion.country}`}
                {suggestion.type === "region" && suggestion.country}
                {suggestion.type === "country" && "Country"}
              </div>
            </li>
          ))}
        </ul>
      )}
      {errors?.location && (
        <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>
      )}
    </div>
  );
};