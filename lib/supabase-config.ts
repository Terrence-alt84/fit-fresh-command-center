// Shared Supabase connection config for the Fit & Fresh Command Center.
// The publishable (anon) key is safe to embed client-side; data access is
// governed by RLS + the authenticated session. Override via env if needed.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://hwqvaivjstqikfxtbqgj.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_f9oqSpZCC-H1zaoeVMhwWw_-bsX9AhS";
