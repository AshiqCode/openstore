// Admin auth = Supabase Auth (email + password).
//
// The store owner creates ONE admin user in the Supabase dashboard
// (Authentication → Users → Add user). There is no public sign-up in the app,
// so only someone with Supabase access can create the admin. Logging in issues
// a real JWT, and RLS gates every write (and reading orders) to that logged-in
// admin — the public anon key can only read products/settings and place orders.
//
// `connectWithKeys` is a fallback for stores deployed WITHOUT env vars or a
// baked config.json: it saves the keys to this browser so the owner can reach
// Supabase, then they log in with email + password as normal.

import { getSupabase, makeTempClient, resetSupabase } from './supabase';
import { writeLocalConfig } from './config';

export type AuthResult = { ok: boolean; error?: string };

// ---- Connect (config fallback when there are no env vars / config.json) ----

export async function connectWithKeys(url: string, anonKey: string): Promise<AuthResult> {
  const u = url.trim();
  const k = anonKey.trim();
  if (!u || !k) return { ok: false, error: 'Enter your Project URL and anon key.' };
  let client;
  try {
    client = makeTempClient({ supabaseUrl: u, supabaseAnonKey: k });
  } catch {
    return { ok: false, error: 'That Project URL looks invalid.' };
  }
  try {
    const { error } = await client.from('settings').select('key').limit(1);
    if (error && /invalid|jwt|api key|not authorized/i.test(error.message)) {
      return { ok: false, error: 'These keys are not valid — re-copy them from Supabase.' };
    }
  } catch {
    return { ok: false, error: 'Could not reach Supabase — check the Project URL.' };
  }
  writeLocalConfig({ supabaseUrl: u, supabaseAnonKey: k });
  resetSupabase();
  return { ok: true };
}

// ---- Admin login (Supabase Auth) ------------------------------------------

export async function adminLogin(email: string, password: string): Promise<AuthResult> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Store not connected.' };
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (!error) return { ok: true };
  if (/invalid login credentials/i.test(error.message)) {
    return { ok: false, error: 'Wrong email or password.' };
  }
  if (/email not confirmed/i.test(error.message)) {
    return {
      ok: false,
      error: 'This admin user is not confirmed — open Supabase → Authentication → Users and confirm it.',
    };
  }
  return { ok: false, error: error.message };
}

// Change the logged-in admin's password. We re-verify the current password
// first (Supabase's updateUser doesn't check it) so a walk-up user at an open
// session can't silently change it.
export async function adminChangePassword(current: string, next: string): Promise<AuthResult> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Store not connected.' };
  if (!next || next.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };

  const email = await getAdminEmail();
  if (!email) return { ok: false, error: 'You are not logged in.' };

  const check = await supabase.auth.signInWithPassword({ email, password: current });
  if (check.error) return { ok: false, error: 'Current password is wrong.' };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---- Session (managed by Supabase Auth) -----------------------------------

export async function isLoggedIn(): Promise<boolean> {
  const supabase = await getSupabase();
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function getAdminEmail(): Promise<string> {
  const supabase = await getSupabase();
  if (!supabase) return '';
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.email ?? '';
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabase();
  if (supabase) await supabase.auth.signOut();
}
