"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

const PaystackButton = dynamic(
  () => import("react-paystack").then((mod) => mod.PaystackButton),
  { ssr: false }
);

const SubscriptionManager = ({ restaurant }) => {
  const [subscriptionDue, setSubscriptionDue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstChargeDate, setFirstChargeDate] = useState(null);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const [hasPayment, setHasPayment] = useState(false);
  const ANNUAL_SUBSCRIPTION_AMOUNT = 1920000;

  // Enhanced fetch function
  const fetchPaymentData = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("created_at")
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setFirstChargeDate(new Date(data[0].created_at));
        setHasPayment(true); // Mark that payment exists
        setShowSubscriptionPrompt(false); // Ensure prompt is hidden
      } else {
        setHasPayment(false);
        setShowSubscriptionPrompt(true);
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
      toast.error("Failed to load payment information");
    }
  };

  // Fetch payment data on mount and when restaurant changes
  useEffect(() => {
    fetchPaymentData();
  }, [restaurant]);

  // Check if subscription is due
  useEffect(() => {
    if (!firstChargeDate) return;

    const checkSubscriptionDue = () => {
      const today = new Date();
      const chargeDate = new Date(firstChargeDate);
      const nextChargeDate = new Date(
        chargeDate.getFullYear() + 1,
        chargeDate.getMonth(),
        chargeDate.getDate()
      );
      const reminderDate = new Date(nextChargeDate);
      reminderDate.setDate(nextChargeDate.getDate() - 30);

      setSubscriptionDue(today >= reminderDate && today < nextChargeDate);
    };

    checkSubscriptionDue();
  }, [firstChargeDate]);

  // Paystack configuration
  const config = {
    reference: new Date().getTime().toString(),
    email: restaurant?.owner_email || "danloski25@gmail.com",
    amount: ANNUAL_SUBSCRIPTION_AMOUNT,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    currency: "GHS",
    metadata: {
      restaurant_id: restaurant.id,
      subscription_type: "annual",
    },
  };

  // Enhanced payment success handler
  const onSuccess = async (response) => {
    setLoading(true);
    try {
      // Save payment details
      const { error } = await supabase
        .from("payments")
        .insert([{
          restaurant_id: restaurant.id,
          amount: 19200,
          status: "success",
          transaction_reference: response.reference,
          authorization_code: response.authorization?.authorization_code,
          subscription_type: "annual",
        }]);

      if (error) throw error;

      // Refresh payment data
      await fetchPaymentData();

      toast.success("Payment successful! Annual subscription activated.");
    } catch (error) {
      console.error("Payment processing error:", error);
      toast.error("Failed to complete payment process");
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    toast.error("Payment canceled or failed. Please try again.");
  };

  return (
    <>
      {/* Only show prompt if no payment exists */}
      {showSubscriptionPrompt && !hasPayment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-4 text-indigo-100">Subscription Required</h2>
            <p className="text-white mb-6">
              To access the system, you need to subscribe to our annual plan for 19,200 GHS.
            </p>
            {PaystackButton && (
              <PaystackButton
                {...config}
                text="Subscribe Now"
                onSuccess={onSuccess}
                onClose={onClose}
                className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded-lg hover:opacity-80 transition-all disabled:opacity-50 w-full"
                disabled={loading}
              />
            )}
          </div>
        </div>
      )}

      {/* Subscription reminder */}
      {subscriptionDue && (
        <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg flex items-center gap-4 z-50">
          <p className="text-white">
            Your annual subscription of 19,200 GHS is due for renewal in 30 days.
          </p>
          {PaystackButton && (
            <PaystackButton
              {...config}
              text="Renew Now"
              onSuccess={onSuccess}
              onClose={onClose}
              className="bg-gradient-to-r from-yellow-400 to-pink-600 px-4 py-2 rounded-lg hover:opacity-80 transition-all disabled:opacity-50"
              disabled={loading}
            />
          )}
        </div>
      )}
    </>
  );
};

export default SubscriptionManager;