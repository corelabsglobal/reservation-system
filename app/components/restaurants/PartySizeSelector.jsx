'use client';

export default function PartySizeSelector({ 
  partySize, 
  handlePartySizeChange,
  bookingCost,
  bookingCostTiers
}) {
  return (
    <div className="mt-4">
      <label className="text-yellow-400 font-semibold">Party Size:</label>
      <select
        value={partySize}
        onChange={handlePartySizeChange}
        className="bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-400 w-full mt-2"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
          <option key={size} value={size}>{size} {size === 1 ? 'person' : 'people'}</option>
        ))}
      </select>
      {bookingCost > 0 && bookingCostTiers.length > 0 && (
        <p className="text-gray-400 text-sm mt-1">
          Deposit: {bookingCost} GHS (for {partySize} {partySize === 1 ? 'person' : 'people'})
        </p>
      )}
    </div>
  );
}