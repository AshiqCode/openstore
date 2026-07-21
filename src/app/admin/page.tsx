'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Store, Link2, KeyRound, ChevronDown, ExternalLink, Database } from 'lucide-react';
import { SetupWizard } from '@/components/wizard/SetupWizard';
import { FullPageSpinner, Spinner } from '@/components/Spinner';
import { BrandGlow } from '@/components/BrandGlow';
import { CopyButton } from '@/components/CopyButton';
import { resolveConfig, readLocalConfig } from '@/lib/config';
import { isLoggedIn, adminLogin, adminSignup, connectWithKeys } from '@/lib/auth';
import { SETUP_SQL } from '@/lib/setupSql';
import { useT } from '@/components/LanguageProvider';

type Mode = 'checking' | 'connect' | 'auth' | 'wizard';

export default function AdminEntry() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('checking');

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/admin/dashboard');
      return;
    }
    resolveConfig().then((config) => setMode(config ? 'auth' : 'connect'));
  }, [router]);

  if (mode === 'checking') return <FullPageSpinner />;
  if (mode === 'wizard') return <SetupWizard />;
  if (mode === 'connect')
    return <ConnectStore onConnected={() => setMode('auth')} onWizard={() => setMode('wizard')} />;
  return <AuthScreen onSuccess={() => router.replace('/admin/dashboard')} />;
}

function Shell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <BrandGlow />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-[color:var(--color-primary-fg)] shadow-lg">
            <Store size={26} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted">{sub}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function IconField({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted" />
      {children}
    </div>
  );
}

// Shown only when there is NO Supabase config (no env vars, no config.json).
// Lets the owner connect this browser by pasting keys; env-var deploys skip this.
function ConnectStore({ onConnected, onWizard }: { onConnected: () => void; onWizard: () => void }) {
  const [url, setUrl] = useState('');
  const [anon, setAnon] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const local = readLocalConfig();
    if (local) {
      setUrl(local.supabaseUrl);
      setAnon(local.supabaseAnonKey);
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const res = await connectWithKeys(url, anon);
    setBusy(false);
    if (res.ok) onConnected();
    else setErr(res.error || 'Could not connect.');
  }

  return (
    <Shell title="Connect your store" sub="Link this store to your Supabase project">
      <form onSubmit={submit} className="card p-6 shadow-xl">
        <p className="mb-4 rounded-theme bg-bg p-3 text-xs text-muted">
          Tip: set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel and every visitor is connected
          automatically. Or paste them here to use this device.
        </p>
        <label className="label">Project URL</label>
        <IconField icon={Link2}>
          <input
            className="input pl-9"
            placeholder="https://xxxx.supabase.co"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setErr(''); }}
          />
        </IconField>
        <label className="label mt-3">anon public key</label>
        <IconField icon={KeyRound}>
          <textarea
            className="input min-h-20 pl-9 font-mono text-xs"
            placeholder="eyJhbGciOi..."
            value={anon}
            onChange={(e) => { setAnon(e.target.value); setErr(''); }}
          />
        </IconField>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <button className="btn btn-primary mt-5 w-full" disabled={busy}>
          {busy ? <Spinner size={18} /> : 'Connect'}
        </button>
        <button type="button" className="btn btn-ghost mt-2 w-full text-sm" onClick={onWizard}>
          Prefer a guided walk-through?
        </button>
      </form>
    </Shell>
  );
}

type Tab = 'login' | 'signup';

// Email + password admin login (accounts live in the `admins` table).
function AuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const S = useT();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showSql, setShowSql] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!email.trim() || !password) return setErr('Enter your email and password.');

    setBusy(true);
    let res;
    if (tab === 'signup') {
      if (password.length < 6) { setBusy(false); return setErr('Password must be at least 6 characters.'); }
      if (password !== confirm) { setBusy(false); return setErr('Passwords do not match.'); }
      res = await adminSignup(email, password);
    } else {
      res = await adminLogin(email, password);
    }
    setBusy(false);
    if (res.ok) return onSuccess();
    setErr(res.error || 'Something went wrong.');
    if (/setup sql|not complete/i.test(res.error || '')) setShowSql(true);
  }

  return (
    <Shell
      title={tab === 'login' ? S.adminLogin : 'Create admin account'}
      sub="Log in with your email and password"
    >
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-theme border border-line bg-card p-1">
        {(['login', 'signup'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setErr(''); }}
            className="rounded-[calc(var(--radius)-2px)] py-2 text-sm font-medium transition"
            style={tab === t ? { background: 'var(--color-primary)', color: 'var(--color-primary-fg)' } : { color: 'var(--color-muted)' }}
          >
            {t === 'login' ? 'Log in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="card p-6 shadow-xl">
        <label className="label">Email</label>
        <IconField icon={Mail}>
          <input
            className="input pl-9"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErr(''); }}
          />
        </IconField>
        <label className="label mt-3">Password</label>
        <IconField icon={Lock}>
          <input
            className="input pl-9"
            type="password"
            placeholder={tab === 'signup' ? 'At least 6 characters' : ''}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErr(''); }}
          />
        </IconField>
        {tab === 'signup' && (
          <>
            <label className="label mt-3">Confirm password</label>
            <IconField icon={Lock}>
              <input
                className="input pl-9"
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setErr(''); }}
              />
            </IconField>
          </>
        )}

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <button className="btn btn-primary mt-5 w-full" disabled={busy}>
          {busy ? <Spinner size={18} /> : tab === 'login' ? S.login : 'Create account'}
        </button>
      </form>

      {/* First-time SQL helper */}
      <div className="mt-4 card overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          onClick={() => setShowSql((v) => !v)}
        >
          <span className="inline-flex items-center gap-2">
            <Database size={15} /> First time? Set up the database
          </span>
          <ChevronDown size={18} style={{ transform: showSql ? 'rotate(180deg)' : 'none' }} className="transition-transform" />
        </button>
        {showSql && (
          <div className="border-t border-line p-4">
            <p className="mb-3 text-sm text-muted">
              Run this once in Supabase → SQL Editor, then use <b>Create account</b> above to make
              your admin login.
            </p>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={SETUP_SQL} label="Copy SQL" className="btn btn-primary" />
              <a
                href="https://supabase.com/dashboard/project/_/sql/new"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline inline-flex items-center gap-1.5"
              >
                Open SQL Editor <ExternalLink size={15} />
              </a>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
