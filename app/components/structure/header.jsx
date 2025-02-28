"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User, UserCircle } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
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
    setMenuOpen(false);
    toast.success("Signed out successfully");
  };

  const handleUserClick = () => {
    if (user) {
      setMenuOpen(!menuOpen);
    } else {
      router.push("/signin");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900 bg-opacity-90 text-white flex justify-between items-center px-6 py-4 z-50 shadow-md">
      <Toaster />
      <div className="font-serif italic text-white opacity-90">
        <h1 className="text-center text-xl sm:text-2xl md:text-2xl lg:text-2xl">SerenePath</h1>
      </div>

      <div className="relative">
        {user ? (
          <div 
            className="w-9 h-9 flex items-center justify-center bg-purple-600 text-white rounded-full font-bold text-lg shadow-md cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {getUserInitials(user.user_metadata?.full_name || user.email)}
          </div>
        ) : (
          <UserCircle className="w-8 h-8 text-gray-400 cursor-pointer" onClick={handleUserClick}/>
        )}

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg py-1 z-50">
            <button
              onClick={handleSignOut}
              className="block w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 text-center"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}