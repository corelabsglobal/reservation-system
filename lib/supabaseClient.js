import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// When a refresh token is invalid (revoked, expired on the server, or simply
// not found), Supabase fires a SIGNED_OUT event. We clear every stale "sb-*"
// key from localStorage so the error does not repeat on every page load.
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      Object.keys(localStorage)
        .filter((key) => key.startsWith("sb-"))
        .forEach((key) => localStorage.removeItem(key));
    }
  });
}
