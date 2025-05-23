import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get yesterday's date
    const yesterday = format(new Date(new Date().setDate(new Date().getDate() - 1)), 'yyyy-MM-dd');

    // Fetch attended reservations from yesterday
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(`
        *,
        restaurants (
          name,
          owner:owner_id (
            email
          )
        )
      `)
      .eq('attended', true)
      .eq('date', yesterday);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch reservations' });
    }

    // Send emails using EmailJS REST API
    for (const reservation of reservations) {
      const templateParams = {
        to_email: reservation.email,
        to_name: reservation.name,
        restaurant_name: reservation.restaurants.name,
        reservation_date: reservation.date,
        reservation_time: reservation.time,
        reply_to: reservation.restaurants.owner?.email || '',
      };

      const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://danloski.com',
        },
        body: JSON.stringify({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_THANK_YOU_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PRIVATE_KEY,
          template_params: templateParams,
        }),
      });

      if (!emailRes.ok) {
        const errorData = await emailRes.text();
        console.error(`EmailJS failed for reservation ${reservation.id}:`, errorData);
      }
    }

    res.status(200).json({ message: `Sent ${reservations.length} thank-you emails` });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
}
