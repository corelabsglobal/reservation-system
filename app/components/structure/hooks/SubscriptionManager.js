"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

// Dynamically import PaystackButton (client-side only)
const PaystackButton = dynamic(
  () => import("react-paystack").then((mod) => mod.PaystackButton),
  { ssr: false }
);

const SubscriptionManager = ({ restaurant }) => {
  const [subscriptionDue, setSubscriptionDue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstChargeDate, setFirstChargeDate] = useState(null);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);

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

  // Check if subscription is due (2 days before the charge date)
  useEffect(() => {
    if (!firstChargeDate) return;

    const checkSubscriptionDue = () => {
      const today = new Date();
      const chargeDate = new Date(firstChargeDate);

      // Calculate the next charge date
      const nextChargeDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        chargeDate.getDate()
      );

      // If today is past the charge date, set the next charge date to the next month
      if (today > nextChargeDate) {
        nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
      }

      // Calculate the reminder date (2 days before the charge date)
      const reminderDate = new Date(nextChargeDate);
      reminderDate.setDate(nextChargeDate.getDate() - 2);

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
    email: restaurant?.owner_email || "kbtechnologies2@gmail.com",
    amount: 15000, // Amount in kobo (15000 kobo = 150 GHS)
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    plan: "PLN_tvgsiiiw4mt1g8y",
    metadata: {
      restaurant_id: restaurant.id,
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
            amount: 150, // Save the amount in GHS
            status: "success",
            transaction_reference: response.reference,
            authorization_code: response.authorization?.authorization_code, 
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

      toast.success("Payment successful! Subscription renewed.");
      setSubscriptionDue(false); // Reset subscription due flag
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
              To access the system, you need to subscribe to our monthly plan for 150 GHS.
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

      {/* Monthly subscription reminder */}
      {subscriptionDue && (
        <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg flex items-center gap-4 z-50">
          <p className="text-white">
            Your monthly subscription of 150 GHS is due in 2 days.
          </p>
          {PaystackButton && (
            <PaystackButton
              {...config}
              text="Pay Now"
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
