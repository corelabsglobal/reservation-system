"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { UserCircle, Menu } from "lucide-react";
import { FaSignOutAlt } from "react-icons/fa";
import { BsFillBuildingsFill, BsFillPeopleFill } from "react-icons/bs";
import { FiUser, FiHome, FiLogOut } from "react-icons/fi";
import { BsCalendarCheck } from "react-icons/bs";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const getUserInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export default function Header() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMobileMenuOpen(false);
    toast.success("Signed out successfully");
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900 bg-opacity-90 text-white flex justify-between items-center px-6 py-4 z-50 shadow-md">
      <Toaster />
      <h1 className="text-xl sm:text-2xl font-serif italic">SerenePath</h1>

      <nav className="hidden md:flex items-center space-x-8 relative bg-transparent">
        {/* Reservations Button */}
        <Link
          href="/reservations"
          className="flex items-center gap-2 text-white bg-gradient-to-r from-[#7B61FF] to-[#5E3AFF] hover:from-[#5E3AFF] hover:to-[#7B61FF] transition-all text-lg font-medium py-2 px-6 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-300"
        >
          <BsCalendarCheck size={19} />
          <span>Reservations</span>
        </Link>

        {/* Profile Link */}
        <Link
          href="/profile"
          className="flex items-center gap-2 text-white bg-gradient-to-r from-[#00C6FF] to-[#0072FF] hover:from-[#0072FF] hover:to-[#00C6FF] transition-all text-lg font-medium py-2 px-6 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-300"
        >
          <FiUser size={19} />
          <span>Profile</span>
        </Link>

        {/* User Dropdown */}
        {/* User Dropdown */}
{user ? (
  <div className="relative group">
    {/* Profile Avatar */}
    <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-[#7B61FF] to-[#5E3AFF] text-white rounded-full font-bold text-lg cursor-pointer shadow-lg border-[3px] border-white hover:scale-105 transition-all">
      {getUserInitials(user.user_metadata?.full_name || user.email)}
    </div>

    {/* Dropdown Menu with Glassmorphism Effect */}
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="absolute top-full right-0 mt-3 w-52 bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-opacity duration-300 pointer-events-none"
    >
      <Link
        href="/profile"
        className="flex items-center gap-2 px-5 py-4 text-white hover:bg-white/20 transition"
      >
        <FiUser size={18} />
        <span>Profile</span>
      </Link>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 w-full text-left px-5 py-4 text-red-400 hover:bg-red-400/20 transition"
      >
        <FiLogOut size={18} />
        <span>Sign Out</span>
      </button>
    </motion.div>
  </div>
) : (
  <UserCircle
    className="w-10 h-10 text-gray-300 hover:text-white transition cursor-pointer"
    onClick={() => router.push("/signin")}
  />
)}
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="w-8 h-8 text-white" />
        </button>
      </div>

      {/* Mobile Full-Screen Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-14 left-0 w-full bg-gray-900 text-white p-5 flex flex-col space-y-4 z-40"
          >
            <Link href="/" className="flex space-x-2" onClick={() => setMobileMenuOpen(false)}>
              <FiHome size={18} />
              <span>Home</span>
            </Link>
            <Link href="/" className="flex space-x-2" onClick={() => setMobileMenuOpen(false)}>
              <BsCalendarCheck />
              <span>Reservations</span>
            </Link>
            <Link href="/" className="flex space-x-2" onClick={() => setMobileMenuOpen(false)}>
              <BsFillPeopleFill size={18} />
              <span>Profile</span>
            </Link>
            <div className="mt-6 border-t border-white/30 pt-4 flex justify-center">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition duration-300"
              >
                <FaSignOutAlt size={18} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
