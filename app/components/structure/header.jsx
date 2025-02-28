"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { UserCircle, Menu } from "lucide-react";
import { FaSignOutAlt } from "react-icons/fa";
import { BsFillBuildingsFill, BsFillPeopleFill } from "react-icons/bs";
import { FiHome } from "react-icons/fi";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

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

      {/* Desktop & Tablet Navigation */}
      <nav className="hidden md:flex items-center space-x-6 relative">
        <div className="group relative">
          <button className="text-white opacity-80 hover:opacity-100 transition-all text-lg font-semibold py-2 px-6 bg-purple-600 rounded-full shadow-lg transform hover:scale-105">
            Reservations
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <Link href="/reservations" className="block px-5 py-3 text-gray-800 hover:bg-purple-100">View Reservations</Link>
            <Link href="/new-reservation" className="block px-5 py-3 text-gray-800 hover:bg-purple-100">New Reservation</Link>
          </div>
        </div>
        <Link href="/profile" className="text-white opacity-80 hover:opacity-100 transition-all text-lg font-semibold py-2 px-6 bg-blue-600 rounded-full shadow-lg transform hover:scale-105">
          Profile
        </Link>
        {user ? (
          <div className="relative group">
            <div className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-full font-bold text-lg cursor-pointer">
              {getUserInitials(user.user_metadata?.full_name || user.email)}
            </div>
            <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <Link href="/profile" className="block px-5 py-3 text-gray-800 hover:bg-purple-100">Profile</Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-5 py-3 text-gray-800 hover:bg-red-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <UserCircle className="w-10 h-10 text-gray-400 cursor-pointer" onClick={() => router.push("/signin")} />
        )}
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="w-8 h-8 text-white" />
        </button>
      </div>

      {/* Mobile Full-Screen Menu */}
      {mobileMenuOpen && (
        <div className="fixed top-14 left-0 w-full bg-gray-900 text-white p-5 flex flex-col space-y-4 z-40">
          <Link href="/" className="flex space-x-2" onClick={() => setMobileMenuOpen(false)}>
            <FiHome size={18} />
            <span>Home</span>
          </Link>
          <Link href="/" className="flex space-x-2" onClick={() => setMobileMenuOpen(false)}>
            <BsFillBuildingsFill />
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
        </div>
      )}
    </header>
  );
}
