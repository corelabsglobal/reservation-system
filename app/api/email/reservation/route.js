import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const {
      type, // 'restaurant' or 'customer'
      to,
      templateData
    } = await request.json();

    if (!type || !to || !templateData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let subject, htmlContent;

    if (type === 'restaurant') {
      subject = `New Reservation - ${templateData.restaurant_name}`;
      htmlContent = generateRestaurantTemplate(templateData);
    } else if (type === 'customer') {
      subject = `Reservation Confirmation - ${templateData.restaurant_name}`;
      htmlContent = generateCustomerTemplate(templateData);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid email type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Danloski Reservations <noreply@danloski.com>',
      to,
      subject,
      html: htmlContent,
      reply_to: templateData.restaurant_email || 'kbtechnologies2@gmail.com'
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function generateRestaurantTemplate(data) {
  return `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #f9f9f9; border: 1px solid #e1e1e1;">
    <div style="background: #1a1a1a; padding: 30px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">NEW RESERVATION</h1>
    </div>
    
    <div style="padding: 30px;">
      <p style="font-size: 16px; line-height: 1.6;">A new reservation has been booked for ${data.restaurant_name}:</p>
      
      <div style="background: #fff; border-left: 4px solid #d4af37; padding: 20px; margin: 25px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        <h3 style="color: #d4af37; margin-top: 0; font-weight: 500;">RESERVATION DETAILS</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 40%; font-weight: 500;">Guest Name:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.customer_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 500;">Contact Email:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${data.customer_email}" style="color: #d4af37; text-decoration: none;">${data.customer_email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 500;">Phone:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.customer_phone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 500;">Date:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.reservation_date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 500;">Time:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.reservation_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 500;">Party Size:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.party_size} guests</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 500;">Table:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.table_type}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 500;">Occasion:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.occasion}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 500;">Special Requests:</td>
            <td style="padding: 8px 0;">${data.special_request}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.dashboard_link}" style="background: #d4af37; color: #1a1a1a; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 500; display: inline-block; letter-spacing: 0.5px;">MANAGE RESERVATION</a>
        <p style="font-size: 14px; color: #666; margin-top: 10px;">Access your dashboard to view, confirm, or cancel reservations</p>
      </div>
      
      <p style="font-size: 14px; color: #666; text-align: center;">This reservation requires your attention in the Reservations tab.</p>
    </div>
    
    <div style="background: #1a1a1a; padding: 20px; text-align: center; font-size: 12px; color: #999;">
      <p style="margin: 0;">© ${data.current_year} ${data.restaurant_name}. All rights reserved.</p>
      <p style="margin: 5px 0 0; font-size: 11px;">Automated notification. Please do not reply.</p>
    </div>
  </div>
  `;
}

function generateCustomerTemplate(data) {
  return `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;background:#f9f9f9;border:1px solid #e1e1e1">
    <div style="background:#1a1a1a;padding:30px;text-align:center">
      <h1 style="color:#d4af37;margin:0;font-size:28px;font-weight:300;letter-spacing:1px">RESERVATION CONFIRMATION</h1>
    </div>
    <div style="padding:30px">
      <p style="font-size:16px;line-height:1.6">Dear ${data.customer_name},</p>
      <p style="font-size:16px;line-height:1.6">Thank you for choosing ${data.restaurant_name}.</p>
      <div style="background:#fff;border-left:4px solid #d4af37;padding:20px;margin:25px 0;box-shadow:0 2px 10px rgba(0,0,0,0.05)">
        <h3 style="color:#d4af37;margin-top:0;font-weight:500">RESERVATION DETAILS</h3>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;width:40%;font-weight:500">Date:</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee">${data.reservation_date}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">Time:</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee">${data.reservation_time}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">Party Size:</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee">${data.party_size} guests</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 500;">Table:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.table_type}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">Occasion:</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee">${data.occasion}</td>
          </tr>
        </table>
      </div>
      <p style="font-size:16px;line-height:1.6">Contact us at <a href="mailto:${data.restaurant_email}" style="color:#d4af37;text-decoration:none">${data.restaurant_email}</a> or ${data.restaurant_phone} for changes.</p>
      <p style="font-size:16px;line-height:1.6;font-weight:500">The ${data.restaurant_name} Team</p>
    </div>
    <div style="background:#1a1a1a;padding:20px;text-align:center;font-size:12px;color:#999">
      <p style="margin:0">© ${data.current_year} ${data.restaurant_name}</p>
    </div>
  </div>
  `;
}