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
  const ANNUAL_SUBSCRIPTION_AMOUNT = 1920000;

  // Fetch the first charge date from Supabase
  useEffect(() => {
    const fetchFirstChargeDate = async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("created_at")
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (data && data.length > 0) {
        setFirstChargeDate(new Date(data[0].created_at));
      } else {
        // If no payment exists, show the subscription prompt
        setShowSubscriptionPrompt(true);
      }
    };

    fetchFirstChargeDate();
  }, [restaurant]);

  // Check if subscription is due (30 days before the annual renewal date)
  useEffect(() => {
    if (!firstChargeDate) return;

    const checkSubscriptionDue = () => {
      const today = new Date();
      const chargeDate = new Date(firstChargeDate);

      // Calculate the next charge date (1 year after first charge)
      const nextChargeDate = new Date(
        chargeDate.getFullYear() + 1,
        chargeDate.getMonth(),
        chargeDate.getDate()
      );

      // Calculate the reminder date (30 days before the charge date)
      const reminderDate = new Date(nextChargeDate);
      reminderDate.setDate(nextChargeDate.getDate() - 30);

      // Check if today is within the reminder period
      if (today >= reminderDate && today < nextChargeDate) {
        setSubscriptionDue(true);
      } else {
        setSubscriptionDue(false);
      }
    };

    checkSubscriptionDue();
  }, [firstChargeDate]);

  // Paystack configuration
  const config = {
    reference: new Date().getTime().toString(),
    email: restaurant?.owner_email || "danloski25@gmail.com",
    amount: ANNUAL_SUBSCRIPTION_AMOUNT, // 19,200 GHS in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    currency: "GHS",
    metadata: {
      restaurant_id: restaurant.id,
      subscription_type: "annual",
    },
  };

  // Handle payment success
  const onSuccess = async (response) => {
    setLoading(true);
    try {
      // Save payment details to Supabase
      const { data, error } = await supabase
        .from("payments")
        .insert([
          {
            restaurant_id: restaurant.id,
            amount: 19200,
            status: "success",
            transaction_reference: response.reference,
            authorization_code: response.authorization?.authorization_code,
            subscription_type: "annual",
          },
        ]);

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      console.log("Payment saved to Supabase:", data);

      // Update the first charge date
      setFirstChargeDate(new Date());

      // Hide the subscription prompt
      setShowSubscriptionPrompt(false);

      toast.success("Payment successful! Annual subscription activated.");
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

  return (
    <>
      {/* Non-closable subscription prompt for first-time users */}
      {showSubscriptionPrompt && (
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

      {/* Annual subscription reminder */}
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