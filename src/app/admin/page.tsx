'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Store, Link2, KeyRound, ExternalLink, ShieldCheck } from 'lucide-react';
import { FullPageSpinner, Spinner } from '@/components/Spinner';
import { BrandGlow } from '@/components/BrandGlow';
import { CopyButton } from '@/components/CopyButton';
import { resolveConfig, readLocalConfig } from '@/lib/config';
import { isLoggedIn, adminLogin, adminAccountExists, connectWithKeys } from '@/lib/auth';
import { buildAdminSetupSql } from '@/lib/setupSql';
import { useT } from '@/components/LanguageProvider';

type Mode = 'checking' | 'connect' | 'setup' | 'login';

export default function AdminEntry() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('checking');

  async function check() {
    setMode('checking');
    if (isLoggedIn()) {
      router.replace('/admin/dashboard');
      return;
    }
    const config = await resolveConfig();
    if (!config) {
      setMode('connect');
      return;
    }
    const exists = await adminAccountExists();
    setMode(exists === true ? 'login' : 'setup');
  }

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (mode === 'checking') return <FullPageSpinner />;
  if (mode === 'connect') return <ConnectStore onConnected={check} />;
  if (mode === 'setup') return <SetupAdmin onReady={() => setMode('login')} />;
  return <LoginForm onSuccess={() => router.replace('/admin/dashboard')} />;
}

function Shell({ title, sub, wide, children }: { title: string; sub: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <BrandGlow />
      <div className={`relative w-full ${wide ? 'max-w-lg' : 'max-w-md'}`}>
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

// Shown only when there's no Supabase config (no env vars / config.json).
function ConnectStore({ onConnected }: { onConnected: () => void }) {
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
          <input className="input pl-9" placeholder="https://xxxx.supabase.co" value={url}
            onChange={(e) => { setUrl(e.target.value); setErr(''); }} />
        </IconField>
        <label className="label mt-3">anon public key</label>
        <IconField icon={KeyRound}>
          <textarea className="input min-h-20 pl-9 font-mono text-xs" placeholder="eyJhbGciOi..." value={anon}
            onChange={(e) => { setAnon(e.target.value); setErr(''); }} />
        </IconField>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <button className="btn btn-primary mt-5 w-full" disabled={busy}>
          {busy ? <Spinner size={18} /> : 'Connect'}
        </button>
      </form>
    </Shell>
  );
}

// First-time setup: enter email + password → we GENERATE the full SQL (with the
// admin account baked in). The owner runs it in Supabase. Only someone with SQL
// access can create the admin, so no one else can register.
function SetupAdmin({ onReady }: { onReady: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sql, setSql] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [checking, setChecking] = useState(false);

  function generate(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr('Enter a valid email.');
    if (password.length < 6) return setErr('Password must be at least 6 characters.');
    if (password !== confirm) return setErr('Passwords do not match.');
    setSql(buildAdminSetupSql(email, password));
  }

  async function iRanIt() {
    setChecking(true);
    setErr('');
    const exists = await adminAccountExists();
    setChecking(false);
    if (exists === true) onReady();
    else setErr("Couldn't find your admin account yet — make sure you pasted and ran the whole SQL in Supabase.");
  }

  if (sql) {
    return (
      <Shell title="Run this SQL in Supabase" sub="It creates your store and your admin login" wide>
        <div className="card p-6 shadow-xl">
          <ol className="mb-3 space-y-1 text-sm text-muted">
            <li>1. Copy the SQL below.</li>
            <li>2. Open your Supabase → SQL Editor → paste → <b>Run</b>.</li>
            <li>3. Come back and click <b>I&apos;ve run it</b>.</li>
          </ol>
          <div className="mb-3 flex flex-wrap gap-2">
            <CopyButton text={sql} label="Copy SQL" className="btn btn-primary" />
            <a href="https://supabase.com/dashboard/project/_/sql/new" target="_blank" rel="noreferrer"
              className="btn btn-outline inline-flex items-center gap-1.5">
              Open SQL Editor <ExternalLink size={15} />
            </a>
          </div>
          <pre className="max-h-56 overflow-auto rounded-theme border border-line bg-bg p-3 text-[11px] leading-relaxed">
            {sql}
          </pre>
          <p className="mt-2 text-xs text-muted">
            ⚠️ This SQL contains your password — only paste it into your own Supabase, and don&apos;t save it publicly.
          </p>
          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
          <div className="mt-4 flex gap-2">
            <button className="btn btn-outline flex-1" onClick={() => setSql(null)}>Back</button>
            <button className="btn btn-primary flex-1" onClick={iRanIt} disabled={checking}>
              {checking ? <Spinner size={18} /> : "I've run it"}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Create your admin login" sub="Only you (via Supabase) can create this">
      <form onSubmit={generate} className="card p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-2 rounded-theme bg-bg p-3 text-xs text-muted">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
          <span>
            We&apos;ll generate a SQL script with your login. You run it once in Supabase — that way
            only the store owner can ever create an admin.
          </span>
        </div>
        <label className="label">Email</label>
        <IconField icon={Mail}>
          <input className="input pl-9" type="email" placeholder="you@example.com" value={email}
            onChange={(e) => { setEmail(e.target.value); setErr(''); }} />
        </IconField>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Password</label>
            <IconField icon={Lock}>
              <input className="input pl-9" type="password" placeholder="Min 6 chars" value={password}
                onChange={(e) => { setPassword(e.target.value); setErr(''); }} />
            </IconField>
          </div>
          <div>
            <label className="label">Confirm</label>
            <IconField icon={Lock}>
              <input className="input pl-9" type="password" value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setErr(''); }} />
            </IconField>
          </div>
        </div>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <button className="btn btn-primary mt-5 w-full">Generate my setup SQL</button>
      </form>
    </Shell>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const S = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!email.trim() || !password) return setErr('Enter your email and password.');
    setBusy(true);
    const res = await adminLogin(email, password);
    setBusy(false);
    if (res.ok) return onSuccess();
    setErr(res.error || 'Could not log in.');
  }

  return (
    <Shell title={S.adminLogin} sub="Log in with your email and password">
      <form onSubmit={submit} className="card p-6 shadow-xl">
        <label className="label">Email</label>
        <IconField icon={Mail}>
          <input className="input pl-9" type="email" autoFocus placeholder="you@example.com" value={email}
            onChange={(e) => { setEmail(e.target.value); setErr(''); }} />
        </IconField>
        <label className="label mt-3">Password</label>
        <IconField icon={Lock}>
          <input className="input pl-9" type="password" value={password}
            onChange={(e) => { setPassword(e.target.value); setErr(''); }} />
        </IconField>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <button className="btn btn-primary mt-5 w-full" disabled={busy}>
          {busy ? <Spinner size={18} /> : S.login}
        </button>
      </form>
    </Shell>
  );
}
