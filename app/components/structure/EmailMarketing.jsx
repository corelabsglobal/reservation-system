'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Paperclip, Send, Users, ChevronDown, Mail, MessageSquare,
  CheckCircle, XCircle, Phone, AlertCircle,
} from 'lucide-react';
import { uploadToCloudinary, sendBatchMarketingEmails } from '@/utils/resend';
import EmailPreview from '../Dashboard/EmailPreview';

// ─── Phone number helpers ─────────────────────────────────────────────────────
// Normalises any Ghanaian number variant to 0XXXXXXXXX for clean display.
const formatPhoneDisplay = (raw) => {
  if (!raw) return '';
  const s = String(raw).replace(/[\s\-().+]/g, '');
  if (s.startsWith('233') && s.length === 12) return '0' + s.slice(3);
  if (s.startsWith('0') && s.length === 10) return s;
  if (/^\d{9}$/.test(s)) return '0' + s;
  return String(raw); // fallback: show as-is
};

// ─── SMS character counter helper ────────────────────────────────────────────
const getSmsInfo = (text) => {
  const len = text.length;
  if (len === 0) return { chars: 0, remaining: 160, parts: 1 };
  // Multi-part SMS uses 153 chars per segment
  if (len <= 160) return { chars: len, remaining: 160 - len, parts: 1 };
  const parts = Math.ceil(len / 153);
  const remaining = parts * 153 - len;
  return { chars: len, remaining, parts };
};

const EmailMarketing = ({ restaurantId, name, customers: propCustomers = [] }) => {
  // ── Shared state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'sms'
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restaurantEmail, setRestaurantEmail] = useState('');
  const [restaurantPhone, setRestaurantPhone] = useState('');

  // ── Email state ───────────────────────────────────────────────────────────
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [emailContent, setEmailContent] = useState({ subject: '', body: '', attachment: null });
  const [isSending, setIsSending] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [emailStats, setEmailStats] = useState({ sent: 0, delivered: 0, opened: 0 });

  // ── SMS state ─────────────────────────────────────────────────────────────
  const [smsSelectedCustomers, setSmsSelectedCustomers] = useState([]);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSenderId, setSmsSenderId] = useState('Didi Jollof');
  const [smsIsSending, setSmsIsSending] = useState(false);
  const [showSmsDropdown, setShowSmsDropdown] = useState(false);
  const [smsResult, setSmsResult] = useState(null); // { successful, failed, total }

  // Customers that have a phone number
  const customersWithPhone = customers.filter((c) => c.phone && String(c.phone).trim());

  const smsInfo = getSmsInfo(smsMessage);

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const [reservationsData, customersData] = await Promise.all([
          supabase
            .from('reservations')
            .select('email, name, number')
            .eq('restaurant_id', restaurantId)
            .not('email', 'is', null),
          supabase
            .from('customers')
            .select('email, name, phone')
            .eq('restaurant_id', restaurantId)
            .not('email', 'is', null),
        ]);

        if (reservationsData.error) throw reservationsData.error;
        if (customersData.error) throw customersData.error;

        const allCustomers = [
          ...(reservationsData.data || []).map((c) => ({
            email: c.email,
            name: c.name,
            phone: c.number,
            source: 'reservation',
          })),
          ...(customersData.data || []).map((c) => ({
            email: c.email,
            name: c.name,
            phone: c.phone,
            source: 'upload',
          })),
        ];

        const uniqueMap = new Map();
        allCustomers.forEach((customer) => {
          if (customer.email) {
            const key = customer.email.toLowerCase().trim();
            if (!uniqueMap.has(key) || customer.source === 'reservation') {
              uniqueMap.set(key, customer);
            }
          }
        });

        setCustomers(Array.from(uniqueMap.values()));
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
        if (restaurant?.owner_id) {
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
      }
    };
    fetchRestaurantContactInfo();
  }, [restaurantId]);

  useEffect(() => {
    if (propCustomers && propCustomers.length > 0) {
      const emailCustomers = propCustomers
        .filter((c) => c.email)
        .reduce((unique, customer) => {
          const key = customer.email.toLowerCase().trim();
          if (!unique.some((u) => u.email.toLowerCase().trim() === key)) {
            unique.push({ email: customer.email, name: customer.name, phone: customer.phone, source: customer.source || 'unknown' });
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
        const { data: campaigns, error: campaignsError } = await supabase
          .from('email_campaigns')
          .select('id, sent_count')
          .eq('restaurant_id', restaurantId);
        if (campaignsError) throw campaignsError;
        if (!campaigns || campaigns.length === 0) return;

        const campaignIds = campaigns.map((c) => c.id);
        const { data: recipients, error: recipientsError } = await supabase
          .from('campaign_recipients')
          .select('delivered, opened')
          .in('campaign_id', campaignIds);
        if (recipientsError) throw recipientsError;

        setEmailStats({
          sent: campaigns.reduce((sum, c) => sum + c.sent_count, 0),
          delivered: recipients.filter((r) => r.delivered).length,
          opened: recipients.filter((r) => r.opened).length,
        });
      } catch (error) {
        console.error('Error fetching email stats:', error);
      }
    };
    fetchEmailStats();
  }, [restaurantId]);

  // ── Email helpers ─────────────────────────────────────────────────────────
  const handleCustomerSelect = (customer) => {
    setSelectedCustomers((prev) =>
      prev.some((c) => c.email === customer.email)
        ? prev.filter((c) => c.email !== customer.email)
        : [...prev, customer]
    );
  };

  const handleSelectAll = () => {
    setSelectedCustomers(selectedCustomers.length === customers.length ? [] : [...customers]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    setEmailContent({ ...emailContent, attachment: file });
  };

  const removeAttachment = () => setEmailContent({ ...emailContent, attachment: null });

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
    });

  const uploadAttachment = async (file) => {
    if (!file) return null;
    try {
      const base64Content = await fileToBase64(file);
      return { content: base64Content, name: file.name, type: file.type || 'application/octet-stream' };
    } catch {
      toast.error('Failed to process attachment');
      throw new Error('Attachment processing failed');
    }
  };

  const saveCampaignToDB = async (subject, body, attachmentFilename) => {
    const { data, error } = await supabase
      .from('email_campaigns')
      .insert([{ restaurant_id: restaurantId, subject, body, attachment_url: attachmentFilename, sent_count: selectedCustomers.length }])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  };

  const saveRecipientsToDB = async (campaignId, recipients) => {
    const { error } = await supabase
      .from('campaign_recipients')
      .insert(recipients.map((c) => ({ campaign_id: campaignId, customer_email: c.email, customer_name: c.name })));
    if (error) throw error;
  };

  const sendEmails = async () => {
    if (!selectedCustomers.length) return toast.error('Please select at least one recipient');
    if (!emailContent.subject || !emailContent.body) return toast.error('Please fill in all required fields');
    if (!selectedDate) return toast.error('Please select a reservation date');

    setIsSending(true);
    try {
      let attachmentData = null;
      if (emailContent.attachment) attachmentData = await uploadAttachment(emailContent.attachment);

      const campaignId = await saveCampaignToDB(emailContent.subject, emailContent.body, emailContent.attachment?.name || null);
      await saveRecipientsToDB(campaignId, selectedCustomers);

      const recipients = selectedCustomers.map((customer) => ({
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
          reservation_date: selectedDate,
        },
      }));

      const result = await sendBatchMarketingEmails(recipients, emailContent.subject, attachmentData);
      let successfulSends = 0;

      for (const [index, customer] of selectedCustomers.entries()) {
        const emailResult = result.results?.[index];
        const delivered = !!emailResult?.success;
        if (delivered) successfulSends++;
        await supabase
          .from('campaign_recipients')
          .update({ sent_at: new Date().toISOString(), delivered, error: delivered ? null : (emailResult?.error || 'Failed to send') })
          .eq('campaign_id', campaignId)
          .eq('customer_email', customer.email);
        if (delivered) setEmailStats((prev) => ({ ...prev, sent: prev.sent + 1, delivered: prev.delivered + 1 }));
      }

      await supabase.from('email_campaigns').update({ sent_count: successfulSends }).eq('id', campaignId);

      toast.success(`Successfully sent ${successfulSends} of ${selectedCustomers.length} emails`);
      setEmailContent({ subject: '', body: '', attachment: null });
      setSelectedCustomers([]);
      setSelectedDate('');
    } catch (error) {
      console.error('Email campaign failed:', error);
      toast.error('Failed to complete email campaign. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // ── SMS helpers ───────────────────────────────────────────────────────────
  const handleSmsCustomerSelect = (customer) => {
    setSmsSelectedCustomers((prev) =>
      prev.some((c) => c.phone === customer.phone)
        ? prev.filter((c) => c.phone !== customer.phone)
        : [...prev, customer]
    );
  };

  const handleSmsSelectAll = () => {
    setSmsSelectedCustomers(smsSelectedCustomers.length === customersWithPhone.length ? [] : [...customersWithPhone]);
  };

  const sendSMS = async () => {
    if (!smsSelectedCustomers.length) return toast.error('Please select at least one recipient');
    if (!smsMessage.trim()) return toast.error('Please write a message before sending');

    setSmsIsSending(true);
    setSmsResult(null);

    try {
      const response = await fetch('/api/sms/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: smsSelectedCustomers.map((c) => ({ name: c.name, phone: c.phone })),
          message: smsMessage.trim(),
          senderId: smsSenderId.trim() || name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'SMS send failed');
      }

      setSmsResult(data.summary);

      if (data.summary.successful > 0) {
        toast.success(`${data.summary.successful} of ${data.summary.total} messages sent successfully`);
      }
      if (data.summary.failed > 0) {
        toast.error(`${data.summary.failed} message${data.summary.failed > 1 ? 's' : ''} could not be delivered`);
      }

      // Reset form on full or partial success
      if (data.summary.successful > 0) {
        setSmsMessage('');
        setSmsSelectedCustomers([]);
        setShowSmsDropdown(false);
      }
    } catch (error) {
      console.error('SMS campaign failed:', error);
      toast.error('Failed to send SMS campaign. Please try again.');
    } finally {
      setSmsIsSending(false);
    }
  };

  // ── Shared badge ──────────────────────────────────────────────────────────
  const getSourceBadge = (source) => {
    const map = {
      reservation: { bg: 'bg-blue-900/30', text: 'text-blue-300', label: 'Reservation' },
      upload: { bg: 'bg-green-900/30', text: 'text-green-300', label: 'Uploaded' },
      unknown: { bg: 'bg-gray-700', text: 'text-gray-300', label: 'Unknown' },
    };
    const c = map[source] || map.unknown;
    return <span className={`px-2 py-0.5 rounded-full text-xs ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden mt-2">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-purple-900/70 to-blue-900/70 p-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Send className="text-blue-300" size={24} />
          Marketing Campaigns
        </h2>
        <p className="text-gray-300 mt-1">
          Reach your customers via Email or SMS — individually or all at once.
        </p>
        {customers.length > 0 && (
          <p className="text-sm text-gray-400 mt-1">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} in your database
            {customersWithPhone.length > 0 && ` · ${customersWithPhone.length} with phone numbers`}
          </p>
        )}
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex border-b border-gray-700 bg-gray-900">
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'email'
              ? 'border-blue-500 text-blue-400 bg-gray-800/50'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Mail size={16} />
          Email
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'sms'
              ? 'border-emerald-500 text-emerald-400 bg-gray-800/50'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare size={16} />
          SMS
          {customersWithPhone.length > 0 && (
            <span className="ml-1 bg-emerald-900/40 text-emerald-300 text-xs px-1.5 py-0.5 rounded-full">
              {customersWithPhone.length}
            </span>
          )}
        </button>
      </div>

      {/* ════════════════════════════════════════
          EMAIL TAB
      ════════════════════════════════════════ */}
      {activeTab === 'email' && (
        <div className="p-6">

          {/* Recipients */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users size={18} />
                Recipients
                {customers.length > 0 && (
                  <span className="text-sm text-gray-400 ml-1">({customers.length} available)</span>
                )}
              </h3>
              <button
                onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                className="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                {selectedCustomers.length > 0 ? (
                  <span className="text-blue-300">{selectedCustomers.length} selected</span>
                ) : (
                  <span className="text-white">Select customers</span>
                )}
                <ChevronDown size={16} className={`transition-transform text-gray-400 ${showCustomerDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showCustomerDropdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gray-800 rounded-lg overflow-hidden mb-4"
              >
                <div className="max-h-60 overflow-y-auto p-2">
                  <div
                    className="p-2 hover:bg-gray-700/50 rounded cursor-pointer flex items-center justify-between"
                    onClick={handleSelectAll}
                  >
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedCustomers.length === customers.length && customers.length > 0} onChange={handleSelectAll} className="accent-blue-500" />
                      <span className="text-sm text-white font-medium">Select all customers</span>
                    </div>
                    <span className="text-xs text-gray-400">{customers.length} total</span>
                  </div>
                  {customers.map((customer) => (
                    <div
                      key={customer.email}
                      className="p-2 hover:bg-gray-700/50 rounded cursor-pointer flex items-center justify-between"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.some((c) => c.email === customer.email)}
                          onChange={() => handleCustomerSelect(customer)}
                          className="accent-blue-500"
                        />
                        <div>
                          <div className="text-sm text-white">{customer.name || 'No Name'}</div>
                          <div className="text-xs text-gray-400">{customer.email}</div>
                        </div>
                      </div>
                      {getSourceBadge(customer.source)}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {selectedCustomers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCustomers.slice(0, 3).map((c) => (
                  <span key={c.email} className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full text-xs">
                    {c.name || c.email}
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Subject *</label>
              <input
                type="text"
                value={emailContent.subject}
                onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g. Announcing our new seasonal menu!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Reservation Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Message *</label>
              <textarea
                value={emailContent.body}
                onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[200px]"
                placeholder="Write your message here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Attachment <span className="text-gray-500">(optional, max 5 MB)</span></label>
              {emailContent.attachment ? (
                <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Paperclip size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-300 truncate max-w-xs">{emailContent.attachment.name}</span>
                  </div>
                  <button onClick={removeAttachment} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full bg-gray-800 border-2 border-gray-700 border-dashed rounded-lg px-4 py-6 cursor-pointer hover:bg-gray-700/50 transition-colors">
                  <Paperclip size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">Click to attach a file</span>
                  <input type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                </label>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <button
                onClick={() => setShowPreview(true)}
                disabled={!emailContent.body}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  !emailContent.body ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-600'
                }`}
              >
                Preview Email
              </button>
              <button
                onClick={sendEmails}
                disabled={isSending || !selectedCustomers.length}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isSending || !selectedCustomers.length
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send to {selectedCustomers.length || 0} {selectedCustomers.length === 1 ? 'customer' : 'customers'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Email Stats */}
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
      )}

      {/* ════════════════════════════════════════
          SMS TAB
      ════════════════════════════════════════ */}
      {activeTab === 'sms' && (
        <div className="p-6">

          {/* No phone numbers notice */}
          {customersWithPhone.length === 0 && (
            <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4 mb-6">
              <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-300 font-medium text-sm">No phone numbers available</p>
                <p className="text-yellow-500 text-xs mt-1">
                  None of your current customers have a phone number on record. Customers who book through the platform will have their number saved automatically. You can also add numbers by importing an updated customer list from the Customers tab.
                </p>
              </div>
            </div>
          )}

          {/* Recipients */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Phone size={18} />
                Recipients
                {customersWithPhone.length > 0 && (
                  <span className="text-sm text-gray-400 ml-1">({customersWithPhone.length} with phone numbers)</span>
                )}
              </h3>
              {customersWithPhone.length > 0 && (
                <button
                  onClick={() => setShowSmsDropdown(!showSmsDropdown)}
                  className="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {smsSelectedCustomers.length > 0 ? (
                    <span className="text-emerald-300">{smsSelectedCustomers.length} selected</span>
                  ) : (
                    <span className="text-white">Select recipients</span>
                  )}
                  <ChevronDown size={16} className={`transition-transform text-gray-400 ${showSmsDropdown ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {showSmsDropdown && customersWithPhone.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gray-800 rounded-lg overflow-hidden mb-4"
              >
                <div className="max-h-64 overflow-y-auto p-2">
                  {/* Select all */}
                  <div
                    className="p-2 hover:bg-gray-700/50 rounded cursor-pointer flex items-center justify-between border-b border-gray-700 mb-1"
                    onClick={handleSmsSelectAll}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={smsSelectedCustomers.length === customersWithPhone.length && customersWithPhone.length > 0}
                        onChange={handleSmsSelectAll}
                        className="accent-emerald-500"
                      />
                      <span className="text-sm text-white font-medium">Select all</span>
                    </div>
                    <span className="text-xs text-gray-400">{customersWithPhone.length} total</span>
                  </div>

                  {customersWithPhone.map((customer) => (
                    <div
                      key={customer.phone}
                      className="p-2 hover:bg-gray-700/50 rounded cursor-pointer flex items-center justify-between"
                      onClick={() => handleSmsCustomerSelect(customer)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={smsSelectedCustomers.some((c) => c.phone === customer.phone)}
                          onChange={() => handleSmsCustomerSelect(customer)}
                          className="accent-emerald-500"
                        />
                        <div>
                          <div className="text-sm text-white">{customer.name || 'No Name'}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone size={10} />
                            {formatPhoneDisplay(customer.phone)}
                          </div>
                        </div>
                      </div>
                      {getSourceBadge(customer.source)}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {smsSelectedCustomers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {smsSelectedCustomers.slice(0, 4).map((c) => (
                  <span key={c.phone} className="bg-emerald-900/30 text-emerald-300 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <Phone size={10} />
                    {c.name || formatPhoneDisplay(c.phone)}
                  </span>
                ))}
                {smsSelectedCustomers.length > 4 && (
                  <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                    +{smsSelectedCustomers.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Compose */}
          <div className="space-y-5">

            {/* Sender name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Sender Name <span className="text-gray-500">(optional · shown instead of a number · max 11 characters)</span>
              </label>
              <input
                type="text"
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value.slice(0, 11))}
                placeholder="Didi Jollof"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to send as <span className="text-gray-300">{name || 'your restaurant name'}</span>. Sender names must be pre-approved by the SMS provider to display correctly.
              </p>
            </div>

            {/* Message */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-300">Message *</label>
                <div className={`text-xs font-mono px-2 py-0.5 rounded ${
                  smsInfo.remaining < 20 ? 'bg-red-900/40 text-red-300' : 'bg-gray-800 text-gray-400'
                }`}>
                  {smsInfo.chars} chars · {smsInfo.remaining} remaining · {smsInfo.parts} SMS
                </div>
              </div>
              <textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                rows={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                placeholder="Type your SMS message here…&#10;&#10;Keep it short and clear. Standard SMS is 160 characters."
              />
              <p className="text-xs text-gray-500 mt-1">
                Messages over 160 characters are split and delivered as multiple SMS — each counted separately against your SMS balance.
              </p>
            </div>

            {/* Send button */}
            <div className="pt-2">
              <button
                onClick={sendSMS}
                disabled={smsIsSending || !smsSelectedCustomers.length || !smsMessage.trim()}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm transition-all ${
                  smsIsSending || !smsSelectedCustomers.length || !smsMessage.trim()
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {smsIsSending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending messages…
                  </>
                ) : (
                  <>
                    <MessageSquare size={16} />
                    Send SMS to {smsSelectedCustomers.length || 0} {smsSelectedCustomers.length === 1 ? 'customer' : 'customers'}
                    {smsInfo.parts > 1 && (
                      <span className="ml-1 text-emerald-200 text-xs">({smsInfo.parts} parts each)</span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result panel */}
          {smsResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-700">
                <h4 className="text-white font-semibold text-sm">Campaign Result</h4>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-700">
                <div className="px-5 py-4 text-center">
                  <div className="text-2xl font-bold text-white">{smsResult.total}</div>
                  <div className="text-xs text-gray-400 mt-1">Total</div>
                </div>
                <div className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle size={18} className="text-emerald-400" />
                    <div className="text-2xl font-bold text-emerald-400">{smsResult.successful}</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Sent</div>
                </div>
                <div className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <XCircle size={18} className="text-red-400" />
                    <div className="text-2xl font-bold text-red-400">{smsResult.failed}</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Failed</div>
                </div>
              </div>
              {smsResult.failed > 0 && (
                <div className="px-5 py-3 bg-red-900/10 border-t border-gray-700">
                  <p className="text-xs text-red-300">
                    Failed messages are usually caused by invalid or unregistered phone numbers. Check your customer list for incorrect numbers.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Tip */}
          <div className="mt-6 bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex gap-3">
            <AlertCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-200">SMS tips:</strong> Keep your message concise and include your restaurant name so recipients know who it's from. Avoid sending during early morning or late night hours.
            </p>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
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
