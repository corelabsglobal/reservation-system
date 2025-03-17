// pages/api/paystack-webhook.js
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const event = req.body;

    // Verify the event is from Paystack (optional but recommended)
    const hash = req.headers["x-paystack-signature"];
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const crypto = require("crypto");

    const computedHash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== computedHash) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Handle subscription events
    if (event.event === "subscription.create") {
      const { customer, authorization } = event.data;

      // Save the authorization code to Supabase
      const { error } = await supabase
        .from("restaurants")
        .update({ authorization_code: authorization.authorization_code })
        .eq("owner_email", customer.email);

      if (error) {
        console.error("Failed to save authorization code:", error);
        return res.status(500).json({ error: "Failed to save authorization code" });
      }
    }

    // Handle successful charges
    if (event.event === "charge.success") {
      const { customer, amount, reference } = event.data;

      // Save payment details to Supabase
      const { error } = await supabase
        .from("payments")
        .insert([
          {
            restaurant_id: customer.metadata?.restaurant_id,
            amount: amount / 100, // Convert from pesewas to GHS
            status: "success",
            transaction_reference: reference,
          },
        ]);

      if (error) {
        console.error("Failed to save payment details:", error);
        return res.status(500).json({ error: "Failed to save payment details" });
      }
    }

    // Handle failed charges
    if (event.event === "charge.failed") {
      const { customer, amount, reference } = event.data;

      // Save failed payment details to Supabase
      const { error } = await supabase
        .from("payments")
        .insert([
          {
            restaurant_id: customer.metadata?.restaurant_id,
            amount: amount / 100, // Convert from pesewas to GHS
            status: "failed",
            transaction_reference: reference,
          },
        ]);

      if (error) {
        console.error("Failed to save failed payment details:", error);
        return res.status(500).json({ error: "Failed to save failed payment details" });
      }
    }

    res.status(200).json({ message: "Webhook received" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}