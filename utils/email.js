/**
 * Send reservation emails via Resend API
 * @param {string} type - 'restaurant' or 'customer'
 * @param {string} to - Recipient email address
 * @param {Object} templateData - Template variables
 * @returns {Promise<Object>} - Response from API
 */
export async function sendReservationEmail(type, to, templateData) {
  try {
    const response = await fetch('/api/email/reservation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        to,
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
 * Send both restaurant and customer reservation emails
 * @param {Object} restaurantData - Data for restaurant email
 * @param {Object} customerData - Data for customer email
 * @returns {Promise<Array>} - Array of results
 */
export async function sendReservationEmails(restaurantData, customerData) {
  try {
    const [restaurantResult, customerResult] = await Promise.all([
      sendReservationEmail('restaurant', restaurantData.to_email, restaurantData),
      sendReservationEmail('customer', customerData.to_email, customerData)
    ]);

    return [restaurantResult, customerResult];
  } catch (error) {
    console.error('Failed to send reservation emails:', error);
    throw error;
  }
}