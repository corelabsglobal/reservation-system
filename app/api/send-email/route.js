import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { reservationData, restaurantEmail, customerEmail, restaurantName } = await request.json();

    // Email to restaurant
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: restaurantEmail,
      subject: `New Reservation at ${restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Reservation for ${restaurantName}</h2>
          <p><strong>Customer:</strong> ${reservationData.name}</p>
          <p><strong>Email:</strong> ${reservationData.email}</p>
          <p><strong>Date:</strong> ${reservationData.date}</p>
          <p><strong>Time:</strong> ${reservationData.time}</p>
          <p><strong>Party Size:</strong> ${reservationData.people}</p>
          ${reservationData.occassion ? `<p><strong>Occasion:</strong> ${reservationData.occassion}</p>` : ''}
          ${reservationData.special_request ? `<p><strong>Special Request:</strong> ${reservationData.special_request}</p>` : ''}
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
            <p><strong>Date:</strong> ${reservationData.date}</p>
            <p><strong>Time:</strong> ${reservationData.time}</p>
            <p><strong>Party Size:</strong> ${reservationData.people}</p>
          </div>
          <p>We look forward to serving you!</p>
          <p style="color: #666; font-size: 0.9em;"><em>This is an automated message. Please do not reply.</em></p>
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