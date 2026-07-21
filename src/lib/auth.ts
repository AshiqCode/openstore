// Admin auth = email + password, stored in the `admins` table (see setup.sql).
//
// The Supabase keys only CONNECT the app (via env vars / config.json). The store
// owner logs in with an email + password — hashed with bcrypt server-side via
// SECURITY DEFINER RPC functions (no email/SMTP, no key typing).
//
// `connectWithKeys` is a fallback for stores deployed WITHOUT env vars or a
// baked config.json: it saves the keys to this browser so the owner can reach
// Supabase, then they log in with email + password as normal.

import { getSupabase, makeTempClient, resetSupabase } from './supabase';
import { writeLocalConfig } from './config';

export type AuthResult = { ok: boolean; error?: string };

const SESSION_KEY = 'admin_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function rpcError(message: string): string {
  if (/could not find the function|does not exist|schema cache/i.test(message))
    return 'Setup not complete — run the setup SQL in Supabase first.';
  return message;
}

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

// ---- Admin account (email + password via RPC) ------------------------------

// Whether an admin account already exists. Returns:
//   true  → an admin exists → show the login form
//   false → connected but no admin yet → show the "generate setup SQL" step
//   null  → couldn't tell (DB not set up / function missing) → also show setup
export async function adminAccountExists(): Promise<boolean | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('admin_exists');
  if (error) return null;
  return data === true;
}

export async function adminLogin(email: string, password: string): Promise<AuthResult> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Store not connected.' };
  const { data, error } = await supabase.rpc('admin_login', {
    p_email: email.trim(),
    p_password: password,
  });
  if (error) return { ok: false, error: rpcError(error.message) };
  if (data === true) {
    startSession(email.trim().toLowerCase());
    return { ok: true };
  }
  return { ok: false, error: 'Wrong email or password.' };
}

export async function adminChangePassword(
  email: string,
  current: string,
  next: string
): Promise<AuthResult> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Store not connected.' };
  const { data, error } = await supabase.rpc('admin_change_password', {
    p_email: email.trim(),
    p_current: current,
    p_new: next,
  });
  if (error) return { ok: false, error: rpcError(error.message) };
  switch (data) {
    case 'ok':
      return { ok: true };
    case 'wrong_current':
      return { ok: false, error: 'Current password is wrong.' };
    case 'weak_password':
      return { ok: false, error: 'New password must be at least 6 characters.' };
    default:
      return { ok: false, error: 'Could not change the password.' };
  }
}

// ---- Session (localStorage, 30 days) --------------------------------------

type Session = { email: string; at: number };

export function startSession(email: string): void {
  if (typeof window === 'undefined') return;
  const session: Session = { email, at: nowMs() };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function signOut(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
}

function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s?.at || nowMs() - s.at > SESSION_TTL_MS) {
      signOut();
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return readSession() !== null;
}

export function getAdminEmail(): string {
  return readSession()?.email ?? '';
}

function nowMs(): number {
  return new Date().getTime();
}
