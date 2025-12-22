'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Paperclip, Send, Users, ChevronDown } from 'lucide-react';
import {  uploadToCloudinary, sendBatchMarketingEmails } from '@/utils/resend';
import EmailPreview from '../Dashboard/EmailPreview';

const EmailMarketing = ({ restaurantId, name, customers: propCustomers = [] }) => {
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
  const [selectedDate, setSelectedDate] = useState('');
  const [restaurantEmail, setRestaurantEmail] = useState('');
  const [restaurantPhone, setRestaurantPhone] = useState('');
  const [emailStats, setEmailStats] = useState({
    sent: 0,
    delivered: 0,
    opened: 0
  });

  useEffect(() => {
    if (!restaurantId) return;

    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        // Fetch customers from both reservations and customers table
        const [reservationsData, customersData] = await Promise.all([
          // Get customers from reservations
          supabase
            .from('reservations')
            .select('email, name, number')
            .eq('restaurant_id', restaurantId)
            .not('email', 'is', null),
          
          // Get customers from customers table
          supabase
            .from('customers')
            .select('email, name, phone')
            .eq('restaurant_id', restaurantId)
            .not('email', 'is', null)
        ]);

        if (reservationsData.error) throw reservationsData.error;
        if (customersData.error) throw customersData.error;

        // Combine both data sources
        const allCustomers = [
          ...(reservationsData.data || []).map(c => ({
            email: c.email,
            name: c.name,
            phone: c.number,
            source: 'reservation'
          })),
          ...(customersData.data || []).map(c => ({
            email: c.email,
            name: c.name,
            phone: c.phone,
            source: 'upload'
          }))
        ];

        const uniqueCustomersMap = new Map();
        
        allCustomers.forEach(customer => {
          if (customer.email) {
            const normalizedEmail = customer.email.toLowerCase().trim();
            if (!uniqueCustomersMap.has(normalizedEmail) || 
                customer.source === 'reservation') {
              uniqueCustomersMap.set(normalizedEmail, customer);
            }
          }
        });

        const uniqueCustomers = Array.from(uniqueCustomersMap.values());
        
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

  useEffect(() => {
    if (!restaurantId) return;

    const fetchRestaurantContactInfo = async () => {
      try {
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('owner_id')
          .eq('id', restaurantId)
          .single();

        if (restaurantError) throw restaurantError;

        if (restaurant && restaurant.owner_id) {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('email, phone')
            .eq('owner_id', restaurant.owner_id)
            .single();

          if (userError) throw userError;

          if (user) {
            setRestaurantEmail(user.email);
            setRestaurantPhone(user.phone || '');
          }
        }
      } catch (error) {
        console.error('Error fetching restaurant contact info:', error);
        toast.error('Failed to fetch restaurant contact information');
      }
    };

    fetchRestaurantContactInfo();
  }, [restaurantId]);

  useEffect(() => {
    if (propCustomers && propCustomers.length > 0) {
      const emailCustomers = propCustomers
        .filter(customer => customer.email)
        .reduce((unique, customer) => {
          const normalizedEmail = customer.email.toLowerCase().trim();
          if (!unique.some(u => u.email.toLowerCase().trim() === normalizedEmail)) {
            unique.push({
              email: customer.email,
              name: customer.name,
              phone: customer.phone,
              source: customer.source || 'unknown'
            });
          }
          return unique;
        }, []);
      
      setCustomers(emailCustomers);
    }
  }, [propCustomers]);

  useEffect(() => {
    if (!restaurantId) return;
  
    const fetchEmailStats = async () => {
      try {
        // Get all campaigns for restaurant
        const { data: campaigns, error: campaignsError } = await supabase
          .from('email_campaigns')
          .select('id, sent_count')
          .eq('restaurant_id', restaurantId);
  
        if (campaignsError) throw campaignsError;
  
        if (!campaigns || campaigns.length === 0) {
          setEmailStats({
            sent: 0,
            delivered: 0,
            opened: 0
          });
          return;
        }
  
        // Get campaign IDs for the restaurant
        const campaignIds = campaigns.map(c => c.id);
  
        // Get all recipients for these campaigns
        const { data: recipients, error: recipientsError } = await supabase
          .from('campaign_recipients')
          .select('delivered, opened')
          .in('campaign_id', campaignIds);
  
        if (recipientsError) throw recipientsError;
  
        // Calculate statistics
        const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.sent_count, 0);
        const totalDelivered = recipients.filter(r => r.delivered).length;
        const totalOpened = recipients.filter(r => r.opened).length;
  
        setEmailStats({
          sent: totalSent,
          delivered: totalDelivered,
          opened: totalOpened
        });
      } catch (error) {
        console.error('Error fetching email stats:', error);
        setEmailStats({
          sent: 0,
          delivered: 0,
          opened: 0
        });
      }
    };
  
    fetchEmailStats();
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

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadAttachment = async (file) => {
    if (!file) return null;
    
    try {
      const base64Content = await fileToBase64(file);
      
      return {
        content: base64Content,
        name: file.name,
        type: file.type || 'application/octet-stream'
      };
    } catch (error) {
      console.error('Attachment processing failed:', error);
      toast.error('Failed to process attachment');
      throw error;
    }
  };

  const saveCampaignToDB = async (subject, body, attachmentFilename) => {
    const { data, error } = await supabase
      .from('email_campaigns')
      .insert([
        { 
          restaurant_id: restaurantId,
          subject,
          body,
          attachment_url: attachmentFilename,
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
      customer_name: customer.name,
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

    if (!selectedDate) {
      toast.error('Please select a reservation date');
      return;
    }

    setIsSending(true);

    try {
      // Upload attachment if exists
      let attachmentData = null;
      if (emailContent.attachment) {
        try {
          attachmentData = await uploadAttachment(emailContent.attachment);
        } catch (error) {
          console.error('Attachment upload failed:', error);
          toast.error('Failed to upload attachment');
        }
      }

      // Save campaign to database
      const campaignId = await saveCampaignToDB(
        emailContent.subject,
        emailContent.body,
        emailContent.attachment ? emailContent.attachment.name : null
      );

      // Save recipients to database
      await saveRecipientsToDB(campaignId, selectedCustomers);

      // Prepare recipients for batch sending
      const recipients = selectedCustomers.map(customer => ({
        email: customer.email,
        templateData: {
          to_name: customer.name,
          to_email: customer.email,
          subject: emailContent.subject,
          message: emailContent.body,
          restaurant_name: name,
          restaurant_id: restaurantId,
          restaurant_email: restaurantEmail,
          restaurant_phone: restaurantPhone,
          reservation_date: selectedDate
        }
      }));

      // Send batch emails via Resend
      const result = await sendBatchMarketingEmails(recipients, emailContent.subject, attachmentData);
      
      let successfulSends = 0;
      let successfulDeliveries = 0;

      // Process results and update database
      for (const [index, customer] of selectedCustomers.entries()) {
        const emailResult = result.results?.[index];
        
        if (emailResult?.success) {
          successfulSends++;
          
          // Mark as sent and delivered in database
          await supabase
            .from('campaign_recipients')
            .update({ 
              sent_at: new Date().toISOString(),
              delivered: true
            })
            .eq('campaign_id', campaignId)
            .eq('customer_email', customer.email);

          successfulDeliveries++;
          
          // Update stats in real-time
          setEmailStats(prev => ({
            ...prev,
            sent: prev.sent + 1,
            delivered: prev.delivered + 1
          }));
        } else {
          // Mark as failed
          await supabase
            .from('campaign_recipients')
            .update({ 
              sent_at: new Date().toISOString(),
              delivered: false,
              error: emailResult?.error || 'Failed to send'
            })
            .eq('campaign_id', campaignId)
            .eq('customer_email', customer.email);
        }
      }

      // Update campaign stats
      await supabase
        .from('email_campaigns')
        .update({ 
          sent_count: successfulSends 
        })
        .eq('id', campaignId);

      toast.success(`Successfully sent ${successfulSends} of ${selectedCustomers.length} emails`);
      
      // Reset form
      setEmailContent({
        subject: '',
        body: '',
        attachment: null
      });
      setSelectedCustomers([]);
      setSelectedDate('');

    } catch (error) {
      console.error('Failed to complete email campaign:', error);
      toast.error('Failed to complete email campaign. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Add customer source badges
  const getCustomerSourceBadge = (source) => {
    const sourceConfig = {
      reservation: { color: 'bg-blue-900/30', text: 'text-blue-300', label: 'Reservation' },
      upload: { color: 'bg-green-900/30', text: 'text-green-300', label: 'Uploaded' },
      unknown: { color: 'bg-gray-700', text: 'text-gray-300', label: 'Unknown' }
    };
    
    const config = sourceConfig[source] || sourceConfig.unknown;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${config.color} ${config.text}`}>
        {config.label}
      </span>
    );
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
          Send promotions and announcements to your customers from reservations and uploaded lists
        </p>
        {customers.length > 0 && (
          <div className="mt-2 text-sm text-gray-400">
            {customers.length} customers with email addresses available
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Recipients Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users size={18} />
              Recipients
              {customers.length > 0 && (
                <span className="text-sm text-gray-400 ml-2">
                  ({customers.length} available)
                </span>
              )}
            </h3>
            <button
              onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
              className="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg transition-colors"
            >
              {selectedCustomers.length > 0 ? (
                <span className="text-blue-300">{selectedCustomers.length} selected</span>
              ) : (
                <span className='text-white'>Select customers</span>
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
                <div className="p-2 hover:bg-gray-700/50 rounded cursor-pointer flex items-center justify-between" onClick={handleSelectAll}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      onChange={handleSelectAll}
                      className="mr-2"
                    />
                    <span className="text-sm text-white">Select all customers</span>
                  </div>
                  <span className="text-xs text-gray-400">{customers.length} total</span>
                </div>
                {customers.map((customer) => (
                  <div
                    key={customer.email}
                    className="p-2 hover:bg-gray-700/50 rounded cursor-pointer flex items-center justify-between"
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.some(c => c.email === customer.email)}
                        onChange={() => handleCustomerSelect(customer)}
                        className="mr-2"
                      />
                      <div>
                        <div className="text-sm text-white">{customer.name || 'No Name'}</div>
                        <div className="text-xs text-gray-400">{customer.email}</div>
                      </div>
                    </div>
                    {getCustomerSourceBadge(customer.source)}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {selectedCustomers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCustomers.slice(0, 3).map(customer => (
                <div key={customer.email} className="flex items-center gap-1 bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full text-xs">
                  <span>{customer.name || 'No Name'}</span>
                  {getCustomerSourceBadge(customer.source)}
                </div>
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

          {/* Date Selection */}
          <div>
            <label htmlFor="reservationDate" className="block text-sm font-medium text-gray-300 mb-1">
              Reservation Date *
            </label>
            <input
              type="date"
              id="reservationDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
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
          restaurantEmail={restaurantEmail}
          restaurantPhone={restaurantPhone}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default EmailMarketing;