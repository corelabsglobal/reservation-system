export async function uploadToCloudinary(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }

    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

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
export async function sendBatchMarketingEmails(recipients, subject, attachmentData = null) {
  try {
    const body = {
      recipients,
      subject,
    };
    
    if (attachmentData) {
      body.attachment = attachmentData.content;
      body.attachmentName = attachmentData.name;
      body.attachmentType = attachmentData.type;
    }

    const response = await fetch('/api/email/marketing/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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