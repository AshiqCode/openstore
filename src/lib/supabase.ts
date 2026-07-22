// Supabase client factory.
//
// We can't create the client at import time because the URL/key aren't known
// until the owner configures the app (config.json or the wizard's localStorage).
// So callers `await getSupabase()` which resolves config lazily and caches the
// client for the session.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { resolveConfig, type StoreConfig } from './config';

let cached: SupabaseClient | null = null;
let cachedKey = '';

function makeClient(config: StoreConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      // Admin logs in with Supabase Auth (see lib/auth.ts). Persist and refresh
      // the session so the JWT authenticates writes (RLS gates them to the
      // logged-in admin). detectSessionInUrl is off — we use password login, not
      // magic links, and the store uses ?id= query params for product routes.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

// Returns a client, or null if the app isn't configured yet.
export async function getSupabase(): Promise<SupabaseClient | null> {
  const config = await resolveConfig();
  if (!config) return null;

  const key = config.supabaseUrl + '|' + config.supabaseAnonKey;
  if (cached && cachedKey === key) return cached;

  cached = makeClient(config);
  cachedKey = key;
  return cached;
}

// Build a throwaway client from explicit values — used by the wizard's
// "Test Connection" step before anything is saved.
export function makeTempClient(config: StoreConfig): SupabaseClient {
  return makeClient(config);
}

// Forget the cached client (e.g. after the owner changes keys).
export function resetSupabase(): void {
  cached = null;
  cachedKey = '';
}
