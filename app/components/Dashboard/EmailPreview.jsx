'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const EmailPreview = ({ emailContent, restaurantName, restaurantId, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Preview Header */}
        <div className="sticky top-0 bg-gray-100 p-4 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold">Email Preview</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Email Preview Content */}
        <div className="email-preview-container">
          <div className="email-container" style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
            <div className="header" style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%)',
              padding: '40px 30px',
              textAlign: 'center',
              borderBottom: '8px solid #c9a769'
            }}>
              <h1 style={{
                color: '#ffffff',
                fontSize: '28px',
                fontWeight: '300',
                letterSpacing: '2px',
                margin: '0',
                textTransform: 'uppercase'
              }}>{restaurantName}</h1>
              <div className="subtitle" style={{
                color: '#c9a769',
                fontSize: '14px',
                letterSpacing: '4px',
                marginTop: '10px',
                textTransform: 'uppercase'
              }}>Exclusive Invitation</div>
            </div>
            
            {/* Main Content */}
            <div className="content" style={{ padding: '40px 30px' }}>
              <div className="greeting" style={{
                fontSize: '18px',
                color: '#1a1a1a',
                marginBottom: '30px',
                borderBottom: '1px solid #e0e0e0',
                paddingBottom: '20px'
              }}>
                Dear Valued Guest,
              </div>
              
              <div className="message" style={{
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#555555',
                marginBottom: '30px'
              }} dangerouslySetInnerHTML={{ __html: emailContent.body }} />
              
              {/* Highlight Section */}
              <div className="highlight" style={{
                backgroundColor: '#f9f7f3',
                borderLeft: '4px solid #c9a769',
                padding: '25px',
                margin: '30px 0'
              }}>
                <h2 style={{
                  color: '#1a1a1a',
                  fontSize: '22px',
                  fontWeight: '300',
                  marginTop: '0',
                  marginBottom: '15px'
                }}>An Exclusive Experience Awaits</h2>
                <p  style={{ color: 'black' }}>We've curated an exceptional evening of gastronomic excellence to delight your senses and create unforgettable memories.</p>
              </div>
              
              {/* CTA Button */}
              <div style={{ textAlign: 'center' }}>
                <a 
                  href={`https://reservation-wheat.vercel.app/restaurants/${restaurantId}`} 
                  className="cta-button" 
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#1a1a1a',
                    color: '#ffffff',
                    textDecoration: 'none',
                    padding: '15px 30px',
                    margin: '20px 0',
                    borderRadius: '0',
                    fontSize: '14px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}
                >
                  Reserve Your Table
                </a>
              </div>
              
              <div className="message" style={{
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#555555',
                marginBottom: '30px'
              }}>
                Should you require any assistance with your reservation or have special requests, our concierge team is at your service.
              </div>
            </div>
            
            {/* Luxury Footer */}
            <div className="footer" style={{
              backgroundColor: '#1a1a1a',
              padding: '30px',
              textAlign: 'center',
              color: '#999999',
              fontSize: '12px'
            }}>
              <p>
                {restaurantName}<br />
                Contact Us
              </p>
              
              <p>
                <a href="#" style={{ color: '#c9a769', textDecoration: 'none' }}>Unsubscribe</a> |{' '}
                <a href="#" style={{ color: '#c9a769', textDecoration: 'none' }}>Privacy Policy</a>
              </p>
              
              <p>
                &copy; 2025 {restaurantName}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
        
        {/* Preview Footer */}
        <div className="sticky bottom-0 bg-gray-100 p-4 flex justify-end border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailPreview;