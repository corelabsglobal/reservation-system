'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Instagram, Mail } from 'lucide-react';

export const LuxuryFooter = () => {
  return (
    <footer className="bg-black py-16 px-6 border-t border-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Signature Container */}
        <div className="flex flex-col items-center">
          {/* Logo with refined presentation */}
          {/*<motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border border-amber-500/30 pointer-events-none" />
              <Image
                src="/images/logo.jpg"
                alt=""
                width={80}
                height={80}
                className="rounded-full object-cover w-full h-full"
                quality={100}
              />
            </div>
          </motion.div>*/}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-center"
          >
            <div className="text-xs text-gray-600 tracking-widest mb-1">
              © {new Date().getFullYear()}
            </div>
            <a
              href="https://corelabsglobal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 tracking-widest cursor-pointer"
            >
              <span className="opacity-70">Powered by</span>{' '}
              <span className="text-amber-400/90">CoreLabs Global</span>
            </a>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};