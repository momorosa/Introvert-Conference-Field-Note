import { createClient } from "@supabase/supabase-js";

// Set these in .env.local (and in Vercel project settings):
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env is missing (e.g. first local run), we still let the app boot in
// local-only mode instead of crashing. supabase will be null and the
// store/auth fall back to localStorage.
export const supabase = url && anon ? createClient(url, anon) : null;
