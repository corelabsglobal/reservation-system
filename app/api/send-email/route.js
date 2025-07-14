import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { reservationData, restaurantEmail, customerEmail, restaurantName } = await request.json();
    const dashboardLink = `https://danloski.com/profile`;

    // Email to restaurant
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: restaurantEmail,
      subject: `New Reservation at ${restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Reservation for ${restaurantName}</h2>
          <div style="background: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>Customer:</strong> ${reservationData.name}</p>
            <p><strong>Email:</strong> ${reservationData.email}</p>
            <p><strong>Phone:</strong> ${reservationData.number || 'Not provided'}</p>
            <p><strong>Date:</strong> ${reservationData.date}</p>
            <p><strong>Time:</strong> ${reservationData.time}</p>
            <p><strong>Party Size:</strong> ${reservationData.people}</p>
            ${reservationData.occassion ? `<p><strong>Occasion:</strong> ${reservationData.occassion}</p>` : ''}
            ${reservationData.special_request ? `<p><strong>Special Request:</strong> ${reservationData.special_request}</p>` : ''}
          </div>
          
          <div style="background: #fff8e1; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Reservation Management</h3>
            <p>You can manage this reservation through your dashboard:</p>
            <a href="${dashboardLink}" style="display: inline-block; background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
              Go to Reservations Dashboard
            </a>
            <p style="margin-top: 10px; font-size: 0.9em; color: #666;">
              Once logged in, navigate to the <strong>Reservations</strong> tab to view, confirm, or cancel reservations.
            </p>
          </div>
        </div>
      `
    });

    // Email to customer
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: customerEmail,
      subject: `Your Reservation at ${restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reservation Confirmation</h2>
          <p>Thank you for booking with ${restaurantName}!</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0;">Reservation Details</h3>
            <p><strong>Date:</strong> ${reservationData.date}</p>
            <p><strong>Time:</strong> ${reservationData.time}</p>
            <p><strong>Party Size:</strong> ${reservationData.people}</p>
            ${reservationData.occassion ? `<p><strong>Occasion:</strong> ${reservationData.occassion}</p>` : ''}
          </div>
          
          <p>We look forward to serving you! If you need to modify or cancel your reservation, please contact the restaurant directly.</p>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9em; color: #666;">
            <p><em>This is an automated message. Please do not reply.</em></p>
          </div>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send emails' },
      { status: 500 }
    );
  }
}