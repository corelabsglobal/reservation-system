import { createClient } from '@supabase/supabase-js';
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

export async function POST(request) {
  try {
    const { reservation } = await request.json();

    if (!reservation) {
      return Response.json({ error: 'Reservation data is required' }, { status: 400 });
    }

    const reservationTime = new Date(`${reservation.date}T${reservation.time}`);
    const formattedDate = reservationTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    const formattedTime = reservationTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reservation Cancellation Confirmation</title>
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
          .cancellation-details {
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
          .cancellation-notice {
            background-color: #fff8f8;
            border-left: 4px solid #e53e3e;
            padding: 15px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reservation Cancellation</h1>
          </div>
          <div class="content">
            <div class="cancellation-notice">
              <h3 style="margin: 0 0 10px 0; color: #e53e3e;">Your reservation has been cancelled</h3>
              <p style="margin: 0;">We're sorry to see you go. Your reservation at ${reservation.restaurants?.name} has been successfully cancelled.</p>
            </div>
            
            <p>Hello ${reservation.user_name},</p>
            <p>This email confirms that your reservation has been cancelled. Below are the details of your cancelled reservation:</p>
            
            <div class="cancellation-details">
              <div class="detail-row">
                <div class="detail-label">Restaurant:</div>
                <div class="detail-value">${reservation.restaurants?.name || 'N/A'}</div>
              </div>
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
                <div class="detail-value">${reservation.people} people</div>
              </div>
              ${reservation.special_request ? `
              <div class="detail-row">
                <div class="detail-label">Special Requests:</div>
                <div class="detail-value">${reservation.special_request}</div>
              </div>
              ` : ''}
            </div>
            
            <p>If this cancellation was made in error or you'd like to reschedule, please contact the restaurant directly.</p>
            
            <div class="restaurant-info">
              <p><strong>${reservation.restaurants?.name || ''}</strong></p>
              ${reservation.restaurants?.address ? `<p>${reservation.restaurants.address}</p>` : ''}
              ${reservation.restaurants?.phone ? `<p>Phone: ${reservation.restaurants.phone}</p>` : ''}
              ${reservation.restaurants?.email ? `<p>Email: ${reservation.restaurants.email}</p>` : ''}
            </div>
            
            <p>We hope to serve you another time!</p>
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
      to: reservation.user_email,
      subject: `Cancellation: Reservation at ${reservation.restaurants?.name || ''}`,
      html: emailHtml,
      replyTo: reservation.restaurants?.email || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    };

    await transporter.sendMail(mailOptions);

    return Response.json({ 
      message: 'Cancellation email sent successfully',
      reservationId: reservation.id 
    });
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return Response.json({ 
      error: 'Failed to send cancellation email',
      details: error.message 
    }, { status: 500 });
  }
}