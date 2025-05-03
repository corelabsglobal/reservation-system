"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FiLogIn, FiUser } from "react-icons/fi";

const LoginPrompt = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6"
    >
      <div className="relative w-32 h-32 mb-6 mt-14">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 blur-lg"></div>
        <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
          <FiUser className="w-12 h-12 text-indigo-400" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Profile Unavailable</h2>
      <p className="text-gray-400 mb-6 max-w-md">
        Please sign in to view your personalized profile, reservations, and statistics.
      </p>
      
      <Link
        href="/signin"
        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
      >
        <FiLogIn className="w-5 h-5" />
        Sign In
      </Link>
      
      <p className="text-gray-500 mt-4 text-sm">
        Don't have an account?{' '}
        <Link href="/signup" className="text-indigo-400 hover:underline">
          Create one
        </Link>
      </p>
    </motion.div>
  );
};

export default LoginPrompt;