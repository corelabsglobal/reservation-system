'use client';

import dynamic from 'next/dynamic';
const PaystackButton = dynamic(
  () => import("react-paystack").then((mod) => mod.PaystackButton),
  { ssr: false }
);

export default function PaymentModal({
  paymentInitialized,
  setPaymentInitialized,
  setOpenDialog,
  bookingCost,
  paystackConfig,
  onPaystackSuccess,
  onPaystackClose
}) {
  if (!paymentInitialized) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="relative z-10 bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <p className="mb-2">
          A reservation cost of {bookingCost} GHS is required.
        </p>
        <PaystackButton
          {...paystackConfig}
          text="Pay Now"
          onSuccess={onPaystackSuccess}
          onClose={onPaystackClose}
          className="w-full bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-3 rounded-lg hover:opacity-80 transition-all mt-2"
        />
        <button 
          onClick={() => {
            setPaymentInitialized(false);
            setOpenDialog(true);
          }}
          className="mt-4 w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md"
        >
          Cancel Payment
        </button>
      </div>
    </div>
  );
}