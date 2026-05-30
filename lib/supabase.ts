import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client for the Fit & Fresh Command Center.
// The publishable key is safe to embed (Supabase publishable keys are designed
// to be shipped); access is governed by RLS. URL/key can be overridden via env.
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://hwqvaivjstqikfxtbqgj.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_KEY ?? "sb_publishable_f9oqSpZCC-H1zaoeVMhwWw_-bsX9AhS";

export function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}
