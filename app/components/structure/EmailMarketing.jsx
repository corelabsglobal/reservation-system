'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Paperclip, Send, Users, ChevronDown } from 'lucide-react';
import EmailPreview from '../Dashboard/EmailPreview';

const EmailMarketing = ({ restaurantId, name }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [emailContent, setEmailContent] = useState({
    subject: '',
    body: '',
    attachment: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [emailStats, setEmailStats] = useState({
    sent: 0,
    delivered: 0,
    opened: 0
  });

  useEffect(() => {
    setServiceId(process.env.NEXT_PUBLIC_EMAILJS_MARKETING_SERVICE_ID);
    setTemplateId(process.env.NEXT_PUBLIC_EMAILJS_MARKETING_TEMPLATE_ID);
    setPublicKey(process.env.NEXT_PUBLIC_EMAILJS_MARKETING_PUBLIC_KEY);
    
    if (publicKey) {
      emailjs.init(publicKey);
    }
  }, [publicKey]);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('email, name, number')
          .eq('restaurant_id', restaurantId)
          .not('email', 'is', null);

        if (error) throw error;

        // Get unique customers
        const uniqueCustomers = Array.from(new Set(data.map(c => c.email)))
          .map(email => {
            return data.find(c => c.email === email);
          })
          .filter(customer => customer !== undefined);

        setCustomers(uniqueCustomers);
      } catch (error) {
        toast.error('Failed to fetch customers');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [restaurantId]);

  const handleCustomerSelect = (customer) => {
    if (selectedCustomers.some(c => c.email === customer.email)) {
      setSelectedCustomers(selectedCustomers.filter(c => c.email !== customer.email));
    } else {
      setSelectedCustomers([...selectedCustomers, customer]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers([...customers]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    setEmailContent({ ...emailContent, attachment: file });
  };

  const removeAttachment = () => {
    setEmailContent({ ...emailContent, attachment: null });
  };

  const uploadAttachment = async (file) => {
    if (!file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `email-attachments/${fileName}`;

    const { data, error } = await supabase
      .storage
      .from('email-attachments')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('email-attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const saveCampaignToDB = async (subject, body, attachmentUrl) => {
    const { data, error } = await supabase
      .from('email_campaigns')
      .insert([
        { 
          restaurant_id: restaurantId,
          subject,
          body,
          attachment_url: attachmentUrl,
          sent_count: selectedCustomers.length
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving campaign:', error);
      throw error;
    }

    return data.id;
  };

  const saveRecipientsToDB = async (campaignId, recipients) => {
    const recipientData = recipients.map(customer => ({
      campaign_id: campaignId,
      customer_email: customer.email,
      customer_name: customer.name
    }));

    const { error } = await supabase
      .from('campaign_recipients')
      .insert(recipientData);

    if (error) {
      console.error('Error saving recipients:', error);
      throw error;
    }
  };

  const sendEmails = async () => {
    if (!selectedCustomers.length) {
      toast.error('Please select at least one recipient');
      return;
    }

    if (!emailContent.subject || !emailContent.body) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSending(true);

    try {
      // Upload attachment if exists
      let attachmentUrl = null;
      if (emailContent.attachment) {
        try {
          attachmentUrl = await uploadAttachment(emailContent.attachment);
        } catch (error) {
          console.error('Attachment upload failed:', error);
          toast.error('Failed to upload attachment');
        }
      }

      // Save campaign to database
      const campaignId = await saveCampaignToDB(
        emailContent.subject,
        emailContent.body,
        attachmentUrl
      );

      // Save recipients to database
      await saveRecipientsToDB(campaignId, selectedCustomers);

      let successfulSends = 0;

      for (const customer of selectedCustomers) {
        try {
          const templateParams = {
            to_name: customer.name,
            to_email: customer.email,
            subject: emailContent.subject,
            message: emailContent.body,
            restaurant_name: name,
            restaurant_id: restaurantId
          };

          await emailjs.send(serviceId, templateId, templateParams);

          successfulSends++;
          setEmailStats(prev => ({
            ...prev,
            sent: prev.sent + 1
          }));

          // Update recipient as sent in database
          await supabase
            .from('campaign_recipients')
            .update({ sent_at: new Date().toISOString() })
            .eq('campaign_id', campaignId)
            .eq('customer_email', customer.email);
        } catch (error) {
          console.error(`Failed to send email to ${customer.email}:`, error);
          // Continue with next email even if one fails
        }
      }

      toast.success(`Successfully sent ${successfulSends} of ${selectedCustomers.length} emails`);
      
      // Reset form after successful send
      setEmailContent({
        subject: '',
        body: '',
        attachment: null
      });
      setSelectedCustomers([]);
    } catch (error) {
      console.error('Failed to complete email campaign:', error);
      toast.error('Failed to complete email campaign. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden mt-2">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/70 to-blue-900/70 p-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Send className="text-blue-300" size={24} />
          Email Marketing
        </h2>
        <p className="text-gray-300 mt-1">
          Send promotions and announcements to your customers
        </p>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Recipients Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users size={18} />
              Recipients
            </h3>
            <button
              onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
              className="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg transition-colors"
            >
              {selectedCustomers.length > 0 ? (
                <span className="text-blue-300">{selectedCustomers.length} selected</span>
              ) : (
                <span>Select customers</span>
              )}
              <ChevronDown size={16} className={`transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showCustomerDropdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800 rounded-lg overflow-hidden mb-4"
            >
              <div className="max-h-60 overflow-y-auto p-2">
                <div className="p-2 hover:bg-gray-700/50 rounded cursor-pointer" onClick={handleSelectAll}>
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === customers.length && customers.length > 0}
                    onChange={handleSelectAll}
                    className="mr-2"
                  />
                  <span className="text-sm">Select all ({customers.length})</span>
                </div>
                {customers.map((customer) => (
                  <div
                    key={customer.email}
                    className="p-2 hover:bg-gray-700/50 rounded cursor-pointer flex items-center"
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomers.some(c => c.email === customer.email)}
                      onChange={() => handleCustomerSelect(customer)}
                      className="mr-2"
                    />
                    <div>
                      <div className="text-sm">{customer.name}</div>
                      <div className="text-xs text-gray-400">{customer.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {selectedCustomers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCustomers.slice(0, 3).map(customer => (
                <span key={customer.email} className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full text-xs">
                  {customer.name}
                </span>
              ))}
              {selectedCustomers.length > 3 && (
                <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                  +{selectedCustomers.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Email Form */}
        <div className="space-y-6">
          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              value={emailContent.subject}
              onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Announcing our new seasonal menu!"
            />
          </div>

          {/* Email Body */}
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-300 mb-1">
              Message *
            </label>
            <textarea
              id="body"
              value={emailContent.body}
              onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[200px]"
              placeholder="Write your message here..."
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Attachment
            </label>
            {emailContent.attachment ? (
              <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Paperclip size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-300 truncate max-w-xs">
                    {emailContent.attachment.name}
                  </span>
                </div>
                <button
                  onClick={removeAttachment}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full bg-gray-800 border-2 border-gray-700 border-dashed rounded-lg px-4 py-6 cursor-pointer hover:bg-gray-700/50 transition-colors">
                <Paperclip size={24} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-400">
                  Click to attach a file (max 5MB)
                </span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </label>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
            <button
              onClick={() => setShowPreview(true)}
              disabled={!emailContent.body}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                !emailContent.body
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-600'
              }`}
            >
              Preview Email
            </button>

            <button
              onClick={sendEmails}
              disabled={isSending || !selectedCustomers.length}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                isSending || !selectedCustomers.length
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send to {selectedCustomers.length} {selectedCustomers.length === 1 ? 'customer' : 'customers'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Email Statistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="text-gray-400 text-sm">Total Sent</div>
              <div className="text-2xl font-bold text-white">{emailStats.sent}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border-l-4 border-green-500">
              <div className="text-gray-400 text-sm">Delivered</div>
              <div className="text-2xl font-bold text-white">{emailStats.delivered}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border-l-4 border-purple-500">
              <div className="text-gray-400 text-sm">Opened</div>
              <div className="text-2xl font-bold text-white">{emailStats.opened}</div>
            </div>
          </div>
        </div>
      </div>
      {showPreview && (
        <EmailPreview
          emailContent={emailContent}
          restaurantName={name}
          restaurantId={restaurantId}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default EmailMarketing;