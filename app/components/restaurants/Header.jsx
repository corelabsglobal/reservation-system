"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { UserCircle, Menu } from "lucide-react";
import { FaSignOutAlt } from "react-icons/fa";
import { BsFillPeopleFill } from "react-icons/bs";
import { FiUser, FiHome, FiLogOut } from "react-icons/fi";
import { BsCalendarCheck } from "react-icons/bs";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const getUserInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export default function RestaurantHeader() {
  const [user, setUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndRestaurant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        // Fetch restaurant data to check if the user is an owner
        const { data: restaurant, error } = await supabase
          .from("restaurants")
          .select("owner_id")
          .eq("owner_id", user.id)
          .single();

        if (restaurant && !error) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      }
    };

    fetchUserAndRestaurant();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsOwner(false); // Reset owner status on sign-out
    setMobileMenuOpen(false);
    toast.success("Signed out successfully");
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900 bg-opacity-90 text-gray-900 flex justify-between items-center px-6 py-4 z-50 shadow-md ">
      <a href="/">
        <h1 className="text-xl sm:text-2xl font-serif italic text-white">DanLoski</h1>
      </a>

      <nav className="hidden md:flex items-center space-x-8 relative bg-transparent">
        {/* Reservations Button */}
        <button
          onClick={() => router.push(user ? "/reservations" : "/guests")}
          className="flex items-center gap-2 text-white bg-gradient-to-r from-[#7B61FF] to-[#5E3AFF] hover:from-[#5E3AFF] hover:to-[#7B61FF] transition-all text-lg font-medium py-2 px-6 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-300"
        >
          <BsCalendarCheck size={19} />
          <span>Reservations</span>
        </button>

        {/* Conditionally render Profile Link */}
        {isOwner && (
          <Link
            href="/admin"
            className="flex items-center gap-2 text-white bg-gradient-to-r from-[#00C6FF] to-[#0072FF] hover:from-[#0072FF] hover:to-[#00C6FF] transition-all text-lg font-medium py-2 px-6 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-300"
          >
            <FiUser size={19} />
            <span>Dashboard</span>
          </Link>
        )}

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
              className="absolute top-full right-0 w-52 bg-gray-900 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-700 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-opacity duration-300 pointer-events-none"
            >
                <Link
                  href="/user"
                  className="flex items-center gap-2 px-5 py-4 text-white hover:bg-gray-800 transition"
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
            className="w-10 h-10 text-gray-600 hover:text-gray-900 transition cursor-pointer"
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
            className="fixed top-14 left-0 w-full bg-white text-gray-900 p-5 flex flex-col space-y-4 z-40 shadow-lg border-b border-gray-200"
          >
            <Link href="/" className="flex space-x-2" onClick={() => setMobileMenuOpen(false)}>
              <FiHome size={18} />
              <span>Home</span>
            </Link>
            <button
              onClick={() => {
                router.push(user ? "/reservations" : "/guests");
                setMobileMenuOpen(false);
              }}
              className="flex space-x-2"
            >
              <BsCalendarCheck />
              <span>Reservations</span>
            </button>
            <Link href="/user" className="flex space-x-2" onClick={() => setMobileMenuOpen(false)}>
              <FiUser size={18} />
              <span>Profile</span>
            </Link>
            {isOwner && (
              <Link href="/admin" className="flex space-x-2" onClick={() => setMobileMenuOpen(false)}>
                <BsFillPeopleFill size={18} />
                <span>Dashboard</span>
              </Link>
            )}
            <div className="mt-6 border-t border-gray-300 pt-4 flex justify-center">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-800 transition duration-300"
                >
                  <FaSignOutAlt size={18} />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => router.push("/signin")}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition duration-300"
                >
                  <FiLogOut size={18} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};