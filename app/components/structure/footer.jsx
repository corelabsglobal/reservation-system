"use client";

import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-t from-gray-900 to-black text-gray-300 py-8">
      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Social Icons */}
        <motion.div 
          className="flex justify-center space-x-6 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <a href="#" className="hover:text-yellow-400 transition">
            <Facebook className="w-6 h-6" />
          </a>
          <a href="#" className="hover:text-yellow-400 transition">
            <Twitter className="w-6 h-6" />
          </a>
          <a href="#" className="hover:text-yellow-400 transition">
            <Instagram className="w-6 h-6" />
          </a>
        </motion.div>

        {/* Footer Links */}
        <nav className="mb-4">
          <ul className="flex justify-center space-x-6 text-sm">
            <li>
              <a href="#" className="hover:text-yellow-400 transition">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400 transition">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400 transition">
                Contact
              </a>
            </li>
          </ul>
        </nav>

        {/* Copyright */}
        <p className="text-xs opacity-80">
          © {new Date().getFullYear()} SerenePath. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}