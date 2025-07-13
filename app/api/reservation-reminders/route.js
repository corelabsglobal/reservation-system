import { createClient } from '@supabase/supabase-js';
import { format, addHours, parseISO } from 'date-fns';
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
    const now = new Date();
    const twoHoursLater = addHours(now, 2);
    
    // Format dates for Supabase query
    const currentTimeStr = format(now, 'HH:mm:ss');
    const twoHoursLaterStr = format(twoHoursLater, 'HH:mm:ss');
    const todayDateStr = format(now, 'yyyy-MM-dd');

    console.log(`Processing reservation reminders between ${currentTimeStr} and ${twoHoursLaterStr} on ${todayDateStr}`);

    // Get reservations happening in the next 2 hours
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(`
        *,
        restaurants (
          name,
          address,
          phone,
          email
        ),
        users (
          name,
          email
        )
      `)
      .eq('date', todayDateStr)
      .gte('time', currentTimeStr)
      .lte('time', twoHoursLaterStr)
      .eq('cancelled', false);

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }

    if (!reservations || reservations.length === 0) {
      console.log('No upcoming reservations found in the next 2 hours');
      return Response.json({ message: 'No reservations to remind' }, { status: 200 });
    }

    const emailResults = [];

    for (const reservation of reservations) {
      const reservationTime = parseISO(`${reservation.date}T${reservation.time}`);
      const formattedTime = format(reservationTime, 'h:mm a');
      const formattedDate = format(reservationTime, 'EEEE, MMMM do yyyy');

      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Upcoming Reservation Reminder</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
              color: #333333;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #1a1a1a;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .reservation-details {
              background-color: #f9f9f9;
              border-radius: 6px;
              padding: 20px;
              margin-bottom: 25px;
            }
            .detail-row {
              display: flex;
              margin-bottom: 10px;
            }
            .detail-label {
              font-weight: 600;
              width: 120px;
              color: #555555;
            }
            .detail-value {
              flex: 1;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #1a1a1a;
              color: #ffffff;
              text-decoration: none;
              border-radius: 4px;
              font-weight: 600;
              margin-top: 15px;
            }
            .footer {
              background-color: #f0f0f0;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #777777;
            }
            .restaurant-info {
              margin-top: 20px;
              font-size: 14px;
              color: #555555;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Upcoming Reservation Reminder</h1>
            </div>
            <div class="content">
              <p>Hello ${reservation.users?.name || 'Guest'},</p>
              <p>This is a friendly reminder about your upcoming reservation at ${reservation.restaurants?.name || 'our restaurant'}.</p>
              
              <div class="reservation-details">
                <div class="detail-row">
                  <div class="detail-label">Date:</div>
                  <div class="detail-value">${formattedDate}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Time:</div>
                  <div class="detail-value">${formattedTime}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Party Size:</div>
                  <div class="detail-value">${reservation.guests} people</div>
                </div>
                ${reservation.special_requests ? `
                <div class="detail-row">
                  <div class="detail-label">Special Requests:</div>
                  <div class="detail-value">${reservation.special_requests}</div>
                </div>
                ` : ''}
              </div>
              
              <p>We're looking forward to serving you!</p>
              
              <div class="restaurant-info">
                <p><strong>${reservation.restaurants?.name || ''}</strong></p>
                ${reservation.restaurants?.address ? `<p>${reservation.restaurants.address}</p>` : ''}
                ${reservation.restaurants?.phone ? `<p>Phone: ${reservation.restaurants.phone}</p>` : ''}
              </div>
              
              <p>If you need to modify or cancel your reservation, please contact the restaurant directly.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply directly to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"${reservation.restaurants?.name || 'Restaurant'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: reservation.users?.email || reservation.email,
        subject: `Reminder: Reservation at ${reservation.restaurants?.name || ''} on ${formattedDate} at ${formattedTime}`,
        html: emailHtml,
        replyTo: reservation.restaurants?.email || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      };

      try {
        await transporter.sendMail(mailOptions);
        emailResults.push({ 
          reservationId: reservation.id, 
          email: reservation.users?.email || reservation.email, 
          status: 'success' 
        });
        console.log(`Reminder sent for reservation ${reservation.id} to ${reservation.users?.email || reservation.email}`);
      } catch (emailError) {
        emailResults.push({ 
          reservationId: reservation.id, 
          email: reservation.users?.email || reservation.email, 
          status: 'failed', 
          error: emailError.message 
        });
        console.error(`Error sending reminder for reservation ${reservation.id}:`, emailError);
      }
    }

    return Response.json({
      message: `Processed ${reservations.length} reservation reminders`,
      results: emailResults,
    });
  } catch (error) {
    console.error('Error processing reservation reminders:', error);
    return Response.json({ 
      error: 'Failed to process reservation reminders', 
      details: error.message 
    }, { status: 500 });
  }
}