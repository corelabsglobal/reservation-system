'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Twitter, Instagram, Linkedin } from 'lucide-react';

export const LuxuryFooter = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Logo Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-1 rounded-full shadow-lg">
            <div className="bg-black p-3 rounded-full flex items-center justify-center w-24 h-24">
              <Image 
                src="/images/logo.jpg" 
                alt="Luxury Brand Logo"
                width={80}
                height={80}
                className="rounded-full object-contain"
              />
            </div>
          </div>
        </motion.div>

        {/* Navigation Links */}
        <nav className="flex flex-wrap justify-center gap-6 md:gap-10 mb-8">
          {['Features', 'Services', 'Testimonials', 'Contact'].map((item) => (
            <Link 
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-gray-300 hover:text-amber-400 transition-colors duration-300 text-sm uppercase tracking-wider font-medium"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* Social Links - Premium Icons */}
        <div className="flex justify-center gap-6 mb-8">
          <motion.a
            whileHover={{ y: -2 }}
            href="#"
            className="text-gray-400 hover:text-[#1DA1F2] transition-colors duration-300 p-2 rounded-full border border-gray-700 hover:border-[#1DA1F2]"
            aria-label="Twitter"
          >
            <Twitter className="h-5 w-5" strokeWidth={1.5} />
          </motion.a>
          
          <motion.a
            whileHover={{ y: -2 }}
            href="#"
            className="text-gray-400 hover:text-[#E1306C] transition-colors duration-300 p-2 rounded-full border border-gray-700 hover:border-[#E1306C]"
            aria-label="Instagram"
          >
            <Instagram className="h-5 w-5" strokeWidth={1.5} />
          </motion.a>
          
          <motion.a
            whileHover={{ y: -2 }}
            href="#"
            className="text-gray-400 hover:text-[#0077B5] transition-colors duration-300 p-2 rounded-full border border-gray-700 hover:border-[#0077B5]"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-5 w-5" strokeWidth={1.5} />
          </motion.a>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xs text-gray-500 tracking-widest uppercase mb-2"
          >
            Powered by
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-amber-400 font-medium tracking-wider text-sm"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
              CoreLabs Global
            </span>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};