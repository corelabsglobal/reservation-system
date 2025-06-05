"use client"

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function MembershipPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Head>
        <title>Churchill Lounge & Bar | Membership</title>
        <meta name="description" content="Exclusive membership portal for Churchill Lounge & Bar" />
      </Head>

      {isLoading ? (
        <LoadingAnimation />
      ) : (
        <PlaceholderScreen />
      )}
    </div>
  );
}

function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="relative w-32 h-32 mb-8">
        {/* Circular border animation */}
        <div className="absolute inset-0 border-4 border-gold-500 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <svg 
            className="w-20 h-20 text-gold-500 animate-[spin_3s_linear_infinite]" 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Stylized H */}
            <path 
              d="M30 20 H40 V50 H60 V20 H70 V80 H60 V60 H40 V80 H30 V20 Z" 
              stroke="currentColor" 
              strokeWidth="4" 
              strokeLinecap="square" 
              strokeLinejoin="miter"
            />
            {/* Left diamond */}
            <path 
              d="M15 40 L20 35 L25 40 L20 45 Z" 
              fill="currentColor"
            />
            {/* Right diamond */}
            <path 
              d="M75 40 L80 35 L85 40 L80 45 Z" 
              fill="currentColor"
            />
            {/* ESTD. 2024 text */}
            <text 
              x="50" 
              y="95" 
              fontSize="12" 
              fontFamily="serif" 
              textAnchor="middle" 
              fill="currentColor"
            >
              ESTD. 2024
            </text>
          </svg>
        </div>
      </div>
      
      <h1 className="text-3xl font-serif font-light tracking-wider mb-2">CHURCHILL</h1>
      <p className="text-gray-400 font-light tracking-widest">LOUNGE & BAR</p>
      
      <div className="mt-16">
        <div className="w-64 h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
        <p className="text-center text-gray-400 mt-4 font-light tracking-wider">
          Accessing membership details...
        </p>
      </div>
    </div>
  );
}

function PlaceholderScreen() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-serif tracking-wider">CHURCHILL</h1>
            <p className="text-sm text-gray-400 tracking-widest">LOUNGE & BAR</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-white" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Stylized H */}
              <path 
                d="M30 20 H40 V50 H60 V20 H70 V80 H60 V60 H40 V80 H30 V20 Z" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeLinecap="square" 
                strokeLinejoin="miter"
              />
              {/* Left diamond */}
              <path 
                d="M15 40 L20 35 L25 40 L20 45 Z" 
                fill="currentColor"
              />
              {/* Right diamond */}
              <path 
                d="M75 40 L80 35 L85 40 L80 45 Z" 
                fill="currentColor"
              />
              {/* ESTD. 2024 text */}
              <text 
                x="50" 
                y="95" 
                fontSize="12" 
                fontFamily="serif" 
                textAnchor="middle" 
                fill="currentColor"
              >
                ESTD. 2024
              </text>
            </svg>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl text-center">
          <div className="relative mb-12">
            <div className="absolute -inset-4 border border-gold-500 rounded-lg opacity-30"></div>
            <div className="relative bg-gray-900 bg-opacity-80 rounded-lg p-12 backdrop-filter backdrop-blur-sm">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gold-500 to-gold-700 rounded-full flex items-center justify-center">
                <svg 
                  className="w-12 h-12 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="1.5" 
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h2 className="text-3xl font-serif font-light mb-4 tracking-wider">
                Membership Verified
              </h2>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Welcome to Churchill Lounge & Bar's exclusive membership portal. 
                Your details are being prepared with the utmost care and discretion.
              </p>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-6"></div>
              <p className="text-gray-400 text-sm tracking-wider">
                Our concierge will contact you shortly to complete your membership profile.
              </p>
            </div>
          </div>

          <button className="px-8 py-3 bg-gradient-to-r from-gold-600 to-gold-800 rounded-full text-white tracking-wider font-light hover:opacity-90 transition-opacity shadow-lg">
            Contact Concierge
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-gray-800 text-center text-gray-500 text-sm tracking-wider">
        <p>© {new Date().getFullYear()} Churchill Lounge & Bar. All rights reserved.</p>
        <p className="mt-1">Exclusivity • Elegance • Excellence</p>
      </footer>
    </div>
  );
}