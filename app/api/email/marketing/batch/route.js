import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL || 'noreply@info.danloski.com';

const getMarketingTemplate = (templateData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateData.subject}</title>
  <style type="text/css">
    /* Base Styles */
    body {
      margin: 0;
      padding: 0;
      background-color: #f8f5f2;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #333333;
      line-height: 1.6;
    }
    
    /* Email Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    /* Luxury Header */
    .header {
      background: linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%);
      padding: 40px 30px;
      text-align: center;
      border-bottom: 8px solid #c9a769;
    }
    
    .header h1 {
      color: white;
      font-size: 28px;
      font-weight: 300;
      letter-spacing: 2px;
      margin: 0;
      text-transform: uppercase;
    }
    
    .header .subtitle {
      color: #c9a769;
      font-size: 14px;
      letter-spacing: 4px;
      margin-top: 10px;
      text-transform: uppercase;
    }
    
    /* Content Section */
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 18px;
      color: #1a1a1a;
      margin-bottom: 30px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 20px;
    }
    
    .message {
      font-size: 16px;
      line-height: 1.8;
      color: #555555;
      margin-bottom: 30px;
    }
    
    /* Highlight Section */
    .highlight {
      background-color: #f9f7f3;
      border-left: 4px solid #c9a769;
      padding: 25px;
      margin: 30px 0;
    }
    
    .highlight h2 {
      color: #1a1a1a;
      font-size: 22px;
      font-weight: 300;
      margin-top: 0;
      margin-bottom: 15px;
    }
    
    /* CTA Button */
    .cta-button {
      display: inline-block;
      background-color: #1a1a1a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 15px 30px;
      margin: 20px 0;
      border-radius: 0;
      font-size: 14px;
      letter-spacing: 1px;
      text-transform: uppercase;
      transition: all 0.3s ease;
    }
    
    .cta-button:hover {
      background-color: #c9a769;
    }
    
    /* Footer */
    .footer {
      background-color: #1a1a1a;
      padding: 30px;
      text-align: center;
      color: #999999;
      font-size: 12px;
    }
    
    .footer a {
      color: #c9a769;
      text-decoration: none;
    }
    
    .social-icons {
      margin: 20px 0;
    }
    
    /* Responsive */
    @media screen and (max-width: 600px) {
      .header, .content, .footer {
        padding: 30px 20px;
      }
      
      .header h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Luxury Header -->
    <div class="header">
      <h1>${templateData.restaurant_name}</h1>
      <div class="subtitle">Exclusive Invitation</div>
    </div>
    
    <!-- Main Content -->
    <div class="content">
      <div class="greeting">
        Dear ${templateData.to_name},
      </div>
      
      <div class="message">
        ${templateData.message}
      </div>
      
      <!-- Highlight Section -->
      <div class="highlight">
        <h2>An Exclusive Experience Awaits</h2>
        <p>We've curated an exceptional evening of gastronomic excellence to delight your senses and create unforgettable memories.</p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="https://danloski.com/restaurants/${templateData.restaurant_id}?date=${templateData.reservation_date}" class="cta-button">Reserve Your Table</a>
      </div>
      
      <div class="message">
        Should you require any assistance with your reservation or have special requests, our concierge team is at your service.
        <br /><br />
        You can reach the restaurant directly at:
        <br />
        <strong>Phone:</strong> ${templateData.restaurant_phone} <br />
        <strong>Email:</strong> ${templateData.restaurant_email}
      </div>
    </div>
    
    <!-- Luxury Footer -->
    <div class="footer">
      <p>
        ${templateData.restaurant_name}<br>
        Contact Us
      </p>
      
      <p>
        <a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a>
      </p>
      
      <p>
        &copy; 2025 ${templateData.restaurant_name}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

export async function POST(request) {
  try {
    const { recipients, subject } = await request.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid recipients array' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent overwhelming the API
    const MAX_BATCH_SIZE = 50;
    const batches = [];
    
    for (let i = 0; i < recipients.length; i += MAX_BATCH_SIZE) {
      batches.push(recipients.slice(i, i + MAX_BATCH_SIZE));
    }

    const results = [];
    const errors = [];

    for (const batch of batches) {
      const batchPromises = batch.map(async (recipient) => {
        try {
          const html = getMarketingTemplate({
            ...recipient.templateData,
            subject: subject
          });

          const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: recipient.email,
            subject: subject,
            html: html,
            reply_to: recipient.templateData.restaurant_email || fromEmail,
          });

          if (error) {
            errors.push({
              email: recipient.email,
              error: error.message
            });
            return { success: false, email: recipient.email, error: error.message };
          }

          return { success: true, email: recipient.email, data };
        } catch (error) {
          errors.push({
            email: recipient.email,
            error: error.message
          });
          return { success: false, email: recipient.email, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add a small delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Sent ${successful.length} of ${recipients.length} emails`,
      summary: {
        total: recipients.length,
        successful: successful.length,
        failed: failed.length,
        errors: errors.length > 0 ? errors : undefined
      },
      results: results
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}