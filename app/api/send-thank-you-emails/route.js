import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function GET(request) {
  try {
    const yesterday = format(new Date(new Date().setDate(new Date().getDate() - 1)), 'yyyy-MM-dd');
    console.log(`Processing thank-you emails for ${yesterday}`);

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
      return Response.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }

    if (!reservations || reservations.length === 0) {
      console.log('No reservations found for yesterday');
      return Response.json({ message: 'No reservations to process' }, { status: 200 });
    }

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
              background-color: #f8f9fa;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              border: 1px solid #e9ecef;
            }
            .header {
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              padding: 30px 20px;
              text-align: center;
              position: relative;
            }
            .logo-container {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 16px;
              margin-bottom: 20px;
            }
            .logo {
              width: 60px;
              height: 60px;
              border-radius: 12px;
              object-fit: cover;
              border: 2px solid #d4af37;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            .brand-name {
              font-family: 'Cinzel', serif;
              font-size: 24px;
              color: #d4af37;
              letter-spacing: 1.5px;
              margin: 0;
              text-transform: uppercase;
              font-weight: 600;
            }
            .restaurant-name {
              font-family: 'Playfair Display', serif;
              font-size: 18px;
              color: #ffffff;
              margin: 8px 0 0 0;
              font-weight: 400;
              letter-spacing: 0.5px;
            }
            .divider {
              height: 1px;
              background: linear-gradient(to right, transparent, rgba(212, 175, 55, 0.3), transparent);
              margin: 0;
            }
            .content {
              padding: 40px 35px;
              color: #2d3748;
              background-color: #ffffff;
              line-height: 1.7;
            }
            h1 {
              font-family: 'Playfair Display', serif;
              font-size: 26px;
              color: #1a202c;
              text-align: center;
              margin: 0 0 25px;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            p {
              font-size: 15px;
              line-height: 1.7;
              margin: 16px 0;
              color: #4a5568;
            }
            .greeting {
              font-size: 16px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 20px;
            }
            .highlight {
              color: #d4af37;
              font-weight: 600;
            }
            .signature {
              font-style: italic;
              color: #718096;
              margin-top: 30px;
              text-align: center;
              font-size: 14px;
              line-height: 1.6;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #d4af37 0%, #b8972e 100%);
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              margin: 25px auto;
              font-size: 15px;
              font-weight: 600;
              text-transform: none;
              letter-spacing: 0.5px;
              box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
              transition: all 0.3s ease;
              text-align: center;
              display: block;
              width: fit-content;
              border: none;
              cursor: pointer;
            }
            .button:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
              background: linear-gradient(135deg, #b8972e 0%, #9c7d25 100%);
            }
            .footer {
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              color: #cbd5e0;
              text-align: center;
              padding: 25px 20px;
              font-size: 13px;
              line-height: 1.6;
            }
            .footer p {
              margin: 6px 0;
              color: #cbd5e0;
              font-size: 13px;
            }
            .footer a {
              color: #d4af37;
              text-decoration: none;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            @media only screen and (max-width: 600px) {
              .container {
                margin: 10px;
                border-radius: 12px;
              }
              .header {
                padding: 25px 15px;
              }
              .logo {
                width: 50px;
                height: 50px;
              }
              .brand-name {
                font-size: 20px;
                letter-spacing: 1px;
              }
              .restaurant-name {
                font-size: 16px;
              }
              .content {
                padding: 30px 25px;
              }
              h1 {
                font-size: 22px;
                margin-bottom: 20px;
              }
              p {
                font-size: 14px;
                line-height: 1.6;
              }
              .button {
                padding: 12px 28px;
                font-size: 14px;
                margin: 20px auto;
              }
              .footer {
                padding: 20px 15px;
                font-size: 12px;
              }
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Cinzel:wght@400;600;700&display=swap" rel="stylesheet">
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <img src="${process.env.RESTAURANT_LOGO_URL || 'https://via.placeholder.com/60'}" alt="${reservation.restaurants.name} Logo" class="logo" />
                <div>
                  <h1 class="brand-name">DanLoski</h1>
                  <p class="restaurant-name">${reservation.restaurants.name}</p>
                </div>
              </div>
            </div>
            <div class="divider"></div>
            <div class="content">
              <h1>Thank You for Dining with Us</h1>
              <p class="greeting">Dear ${reservation.name},</p>
              <p>It was our pleasure to welcome you to <span class="highlight">${reservation.restaurants.name}</span> on ${reservation.date} at ${reservation.time}. Your presence made our evening special, and we're grateful you chose to dine with us.</p>
              <p>We're committed to creating memorable experiences, and we hope your time with us was exceptional. We would be delighted to welcome you back for another wonderful dining experience.</p>
              <a href="${process.env.RESTAURANT_BOOKING_URL || '#'}" class="button">Make Another Reservation</a>
              <p class="signature">Warm regards,<br><strong>The ${reservation.restaurants.name} Team</strong></p>
            </div>
            <div class="footer">
              <p><strong>${reservation.restaurants.name}</strong></p>
              <p>${reservation.restaurants.owner?.email || ''}</p>
              <p>We look forward to serving you again soon</p>
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

    return Response.json({
      message: `Processed ${reservations.length} reservations`,
      results: emailResults,
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return Response.json({ error: 'Failed to send emails', details: error.message }, { status: 500 });
  }
}