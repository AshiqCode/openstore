// Admin auth = "log in with your Supabase keys".
//
// The owner logs in by entering their Supabase Project URL + anon public key.
// We validate by hitting the database; if the store tables exist, the keys are
// accepted, saved as the app config, and an admin session flag is stored in
// localStorage (30-day expiry). This works from any browser/device — no email,
// no account table, no dependency on a pre-baked config.json.

import { makeTempClient, resetSupabase } from './supabase';
import { writeLocalConfig } from './config';

export type AuthResult = {
  ok: boolean;
  error?: string;
  needsSetup?: boolean; // keys valid but store tables missing → run SQL
};

const SESSION_KEY = 'admin_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Validate the Supabase keys and, on success, configure + log in.
export async function loginWithKeys(url: string, anonKey: string): Promise<AuthResult> {
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
    if (error) {
      if (/invalid|jwt|api key|not authorized/i.test(error.message)) {
        return { ok: false, error: 'These keys are not valid — re-copy them from Supabase.' };
      }
      // Reached the server but the tables aren't there yet.
      return {
        ok: false,
        needsSetup: true,
        error: 'Connected, but the store tables are missing. Run the setup SQL first.',
      };
    }
  } catch {
    return { ok: false, error: 'Could not reach Supabase — check the Project URL.' };
  }

  writeLocalConfig({ supabaseUrl: u, supabaseAnonKey: k });
  resetSupabase();
  startSession(u);
  return { ok: true };
}

// ---- Session (localStorage, 30 days) -------------------------------------

type Session = { url: string; at: number };

export function startSession(url = ''): void {
  if (typeof window === 'undefined') return;
  const session: Session = { url, at: nowMs() };
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

// The Supabase project host, shown subtly in the admin header.
export function getSessionHost(): string {
  const s = readSession();
  if (!s?.url) return '';
  try {
    return new URL(s.url).host;
  } catch {
    return '';
  }
}

function nowMs(): number {
  return new Date().getTime();
}
