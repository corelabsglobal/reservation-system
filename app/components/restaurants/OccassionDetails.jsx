import { useState } from "react";
import { Label } from "@/components/ui/label";
import Image from "next/image";

const OccasionDetails = ({ onChange }) => {
  const [occasion, setOccasion] = useState("");
  const [number, setNumber] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");

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

  return (
    <div>
        <div className="flex flex-col">
          <input
            type="number"
            placeholder="Enter Phone Number"
            value={number}
            onChange={handleNumberChange}
            className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400"
          />
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