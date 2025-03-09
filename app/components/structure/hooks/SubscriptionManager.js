// components/SubscriptionManager.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { usePaystackPayment } from "react-paystack";

const SubscriptionManager = ({ restaurant }) => {
  const [subscriptionDue, setSubscriptionDue] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if subscription is due (2 days before the end of the month)
  useEffect(() => {
    const checkSubscriptionDue = () => {
      const today = new Date();
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const daysRemaining = Math.floor((endOfMonth - today) / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 2) {
        setSubscriptionDue(true);
      }
    };

    checkSubscriptionDue();
  }, []);

  // Paystack configuration
  const config = {
    reference: new Date().getTime().toString(),
    email: restaurant?.owner_email || "owner@example.com",
    amount: 1200 * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  // Handle payment success
  const onSuccess = async (response) => {
    setLoading(true);
    try {
      // Save payment details to Supabase
      const { error } = await supabase
        .from("payments")
        .insert([
          {
            restaurant_id: restaurant.id,
            amount: 1200,
            status: "success",
            transaction_reference: response.reference,
          },
        ]);

      if (error) throw error;

      toast.success("Payment successful! Subscription renewed.");
      setSubscriptionDue(false); 
    } catch (error) {
      toast.error("Failed to save payment details.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle payment failure
  const onClose = () => {
    toast.error("Payment canceled or failed. Please try again.");
  };

  // Trigger payment
  const handlePayment = () => {
    initializePayment(onSuccess, onClose);
  };

  return (
    <>
      {subscriptionDue && (
        <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg flex items-center gap-4 z-50">
          <p className="text-white">
            Your monthly subscription of $12 is due in 2 days. Please renew to avoid service interruption.
          </p>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded-lg hover:opacity-80 transition-all disabled:opacity-50"
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </div>
      )}
    </>
  );
};

export default SubscriptionManager;