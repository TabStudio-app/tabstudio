import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Temporary diagnostics for frontend env loading during affiliate submit debugging.
console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("SUPABASE KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);

const supabaseUrl = String(rawSupabaseUrl || "").trim().replace(/\/+$/g, "");
const supabaseAnonKey = String(rawSupabaseAnonKey || "").trim();

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL. Check your .env.local and restart Vite.");
}

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY. Check your .env.local and restart Vite.");
}

if (!/^https:\/\//i.test(supabaseUrl)) {
  throw new Error(`Invalid VITE_SUPABASE_URL "${supabaseUrl}". It must start with https://`);
}

try {
  // Validates URL shape early so failed fetch errors become actionable.
  new URL(supabaseUrl);
} catch {
  throw new Error(`Invalid VITE_SUPABASE_URL "${supabaseUrl}".`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
