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
          <div className="flex space-x-2">
            {/* Country Code Box */}
            <div className="flex items-center bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 w-28 justify-center">
                <Image
                src="/ghana-flag.jpg"
                alt="Ghana Flag"
                width={20}
                height={15}
                className="mr-1"
                />
                <span className="pl-1 text-md">+233</span>
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