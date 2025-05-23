import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify SMTP connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP connection established');
  }
});

export default async function handler(req, res) {
  // Explicitly handle both GET and POST methods
  if (req.method === 'GET' || req.method === 'POST') {
    try {
      // Get yesterday's date
      const yesterday = format(new Date(new Date().setDate(new Date().getDate() - 1)), 'yyyy-MM-dd');
      console.log(`Processing thank-you emails for date: ${yesterday}`);

      // Fetch attended reservations from yesterday
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(
          `*,
          restaurants (
            name,
            owner:owner_id (
              email
            )
          )`
        )
        .eq('attended', true)
        .eq('date', yesterday);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Failed to fetch reservations' });
      }

      if (!reservations || reservations.length === 0) {
        console.log('No reservations found for yesterday');
        return res.status(200).json({ message: 'No reservations to process' });
      }

      console.log(`Found ${reservations.length} reservations to process`);

      // Send emails using Nodemailer
      const emailResults = [];
      for (const reservation of reservations) {
        try {
          const emailHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <!-- Your exact email template here -->
            <body>
              <div class="container">
                <div class="header">
                  <h1 class="header-brand">DanLoski</h1>
                  <img src="${process.env.RESTAURANT_LOGO_URL || 'https://via.placeholder.com/150'}" alt="${reservation.restaurants.name} Logo" />
                </div>
                <div class="divider"></div>
                <div class="content">
                  <h1>Thank You for Dining with Us</h1>
                  <p class="greeting">Dear ${reservation.name},</p>
                  <p>It was our utmost pleasure to welcome you to ${reservation.restaurants.name} on ${reservation.date} at ${reservation.time}. Your presence truly elevated our evening, and we are deeply grateful for choosing to dine with us.</p>
                  <p>We are dedicated to crafting unforgettable experiences, and we sincerely hope your time with us was nothing short of exceptional. We would be honored to welcome you back for another memorable dining experience.</p>
                  <a href="${process.env.RESTAURANT_BOOKING_URL || '#'}" class="button">Reserve Again</a>
                  <p class="signature">Warmest regards,<br>The ${reservation.restaurants.name} Team</p>
                </div>
                <div class="footer">
                  <p>${reservation.restaurants.name} | ${reservation.restaurants.owner?.email || ''}</p>
                  <p>We look forward to serving you again.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          const mailOptions = {
            from: `"${reservation.restaurants.name}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to: reservation.email,
            subject: `Thank You for Dining at ${reservation.restaurants.name}`,
            html: emailHtml,
            replyTo: reservation.restaurants.owner?.email || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
          };

          await transporter.sendMail(mailOptions);
          console.log(`Email successfully sent to ${reservation.email}`);
          emailResults.push({ email: reservation.email, status: 'success' });

          // Add small delay between emails to prevent rate limiting
          if (reservations.indexOf(reservation) < reservations.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (emailError) {
          console.error(`Error sending email to ${reservation.email}:`, emailError);
          emailResults.push({ email: reservation.email, status: 'failed', error: emailError.message });
        }
      }

      return res.status(200).json({ 
        message: `Processed ${reservations.length} reservations`,
        results: emailResults
      });

    } catch (error) {
      console.error('Error in email sending process:', error);
      return res.status(500).json({ 
        error: 'Failed to send emails',
        details: error.message 
      });
    }
  }

  // Return 405 for any other HTTP methods
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}