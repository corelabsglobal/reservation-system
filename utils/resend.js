/**
 * Send marketing emails via Resend API
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {Object} templateData - Template variables
 * @returns {Promise<Object>} - Response from API
 */
export async function sendMarketingEmail(to, subject, templateData) {
  try {
    const response = await fetch('/api/email/marketing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        templateData
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }

    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

/**
 * Send batch marketing emails
 * @param {Array} recipients - Array of recipient objects with email and templateData
 * @param {string} subject - Email subject
 * @returns {Promise<Array>} - Array of results
 */
export async function sendBatchMarketingEmails(recipients, subject) {
  try {
    const response = await fetch('/api/email/marketing/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients,
        subject
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send batch emails');
    }

    return data;
  } catch (error) {
    console.error('Batch email sending error:', error);
    throw error;
  }
}