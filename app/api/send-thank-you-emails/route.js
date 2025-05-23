import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export default async function handler(req, res) {
  // Vercel Cron uses HEAD for the initial check, then GET for execution
  if (!['HEAD', 'GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For HEAD requests (Vercel's cron check), return 200 immediately
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  try {
    // Get yesterday's date
    const yesterday = format(new Date(new Date().setDate(new Date().getDate() - 1)), 'yyyy-MM-dd');
    console.log(`Processing thank-you emails for ${yesterday}`);

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
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank You for Dining with Us</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              background-color: #f0ece3;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .container {
              max-width: 650px;
              margin: 30px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            }
            .header {
              background: linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%);
              padding: 40px 20px;
              text-align: center;
              position: relative;
            }
            .header-brand {
              font-family: 'Cinzel', serif;
              font-size: 32px;
              color: #d4af37;
              letter-spacing: 2px;
              margin: 0;
              text-transform: uppercase;
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
            }
            .header img {
              max-width: 140px;
              margin-top: 15px;
              border-radius: 8px;
              border: 2px solid #d4af37;
            }
            .divider {
              height: 2px;
              background: linear-gradient(to right, transparent, #d4af37, transparent);
              margin: 0;
            }
            .content {
              padding: 40px 30px;
              color: #333333;
              background-color: #fafafa;
            }
            h1 {
              font-family: 'Playfair Display', serif;
              font-size: 28px;
              color: #1a1a1a;
              text-align: center;
              margin: 0 0 20px;
              letter-spacing: 1px;
            }
            p {
              font-size: 16px;
              line-height: 1.8;
              margin: 12px 0;
              color: #4a4a4a;
            }
            .greeting {
              font-size: 18px;
              font-weight: bold;
              color: #2b2b2b;
            }
            .signature {
              font-style: italic;
              color: #666666;
              margin-top: 25px;
              text-align: center;
              font-size: 15px;
              line-height: 1.5;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              background: linear-gradient(135deg, #d4af37 0%, #b8972e 100%);
              color: #ffffff;
              text-decoration: none;
              border-radius: 50px;
              margin: 20px auto;
              font-size: 16px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
              text-align: center;
              display: block;
              width: fit-content;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
            }
            .footer {
              background: linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%);
              color: #d4af37;
              text-align: center;
              padding: 20px;
              font-size: 13px;
              line-height: 1.6;
            }
            .footer p {
              margin: 5px 0;
              color: #d4af37;
            }
            @media only screen and (max-width: 600px) {
              .container {
                margin: 15px;
                border-radius: 8px;
              }
              .header {
                padding: 30px 15px;
              }
              .header-brand {
                font-size: 24px;
              }
              .content {
                padding: 25px 20px;
              }
              h1 {
                font-size: 24px;
              }
              p {
                font-size: 14px;
                line-height: 1.6;
              }
              .button {
                padding: 12px 24px;
                font-size: 14px;
              }
              .footer {
                padding: 15px;
                font-size: 12px;
              }
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
        </head>
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

      try {
        await transporter.sendMail(mailOptions);
        emailResults.push({ email: reservation.email, status: 'success' });
        console.log(`Email sent to ${reservation.email}`);
      } catch (emailError) {
        emailResults.push({ email: reservation.email, status: 'failed', error: emailError.message });
        console.error(`Error sending email to ${reservation.email}:`, emailError);
      }
    }

    res.status(200).json({ 
      message: `Processed ${reservations.length} reservations`,
      results: emailResults
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ 
      error: 'Failed to send emails',
      details: error.message 
    });
  }
}