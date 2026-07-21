// Config bootstrap — how the app finds Supabase.
//
// Resolution order:
//   1. Build-time env vars  (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)
//      → the clean way for a GitHub → Vercel deploy: set two env vars in the
//        Vercel dashboard and every visitor gets a working store.
//   2. localStorage["store_config"]  (set on the owner's browser at login;
//        instant, no network round-trip)
//   3. public/config.json   (baked into the deployed folder — drag & drop deploy)
//
// Env vars win because they are the canonical, deploy-wide configuration.

export type StoreConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export const LOCAL_CONFIG_KEY = 'store_config';

const EMPTY: StoreConfig = { supabaseUrl: '', supabaseAnonKey: '' };

function isFilled(c: StoreConfig | null | undefined): c is StoreConfig {
  return !!c && !!c.supabaseUrl?.trim() && !!c.supabaseAnonKey?.trim();
}

// Read Supabase config from build-time env vars. Next.js inlines NEXT_PUBLIC_*
// variables into the bundle at build time, so this works in a static export.
// The names MUST be referenced literally for the inlining to happen.
export function readEnvConfig(): StoreConfig | null {
  const config: StoreConfig = {
    supabaseUrl: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    supabaseAnonKey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
  };
  return isFilled(config) ? config : null;
}

// Read localStorage config (client only). Returns null if absent/invalid.
export function readLocalConfig(): StoreConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoreConfig;
    return isFilled(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Persist config to localStorage (wizard uses this after a successful test).
export function writeLocalConfig(config: StoreConfig): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
}

export function clearLocalConfig(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LOCAL_CONFIG_KEY);
}

// Fetch the baked public/config.json. Never throws — returns EMPTY on failure.
export async function readPublicConfig(): Promise<StoreConfig> {
  if (typeof window === 'undefined') return EMPTY;
  try {
    // cache: no-store so a re-uploaded config.json is picked up on next load.
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (!res.ok) return EMPTY;
    const parsed = (await res.json()) as StoreConfig;
    return isFilled(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

// The real resolver: env vars (canonical, deploy-wide) → owner's localStorage
// (instant, no network) → baked config.json (fallback for visitors).
// Returns null when the app is unconfigured (→ shows the /admin setup).
export async function resolveConfig(): Promise<StoreConfig | null> {
  const env = readEnvConfig();
  if (isFilled(env)) return env;

  const local = readLocalConfig();
  if (isFilled(local)) return local;

  const pub = await readPublicConfig();
  return isFilled(pub) ? pub : null;
}

// Build the literal file contents for the "Download config.json" wizard step.
export function buildConfigFileContents(config: StoreConfig): string {
  return JSON.stringify(
    { supabaseUrl: config.supabaseUrl.trim(), supabaseAnonKey: config.supabaseAnonKey.trim() },
    null,
    2
  );
}
