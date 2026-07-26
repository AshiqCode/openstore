// Supabase clients for SERVER code (API routes only).
//
// The browser resolves Supabase config lazily from config.json / localStorage
// (see lib/config.ts), but a server route has no browser storage — it reads the
// same values from environment variables, which is also what Vercel provides.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL_ENV = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON_ENV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SERVICE_ENV = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

// Public-readable data (products, settings). Same permissions as a visitor.
export function serverSupabase(): SupabaseClient | null {
  if (!URL_ENV || !ANON_ENV) return null;
  return createClient(URL_ENV, ANON_ENV, noSession);
}

// Full-access client — RLS lets only the logged-in admin update orders, and a
// webhook has no login, so marking an order paid needs the service role key.
// NEVER import this from client code; the key must never reach the browser.
export function serviceSupabase(): SupabaseClient | null {
  if (!URL_ENV || !SERVICE_ENV) return null;
  return createClient(URL_ENV, SERVICE_ENV, noSession);
}
