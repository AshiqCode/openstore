'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Store, ExternalLink, ChevronDown } from 'lucide-react';
import { FullPageSpinner, Spinner } from '@/components/Spinner';
import { BrandGlow } from '@/components/BrandGlow';
import { CopyButton } from '@/components/CopyButton';
import { isLoggedIn, adminLogin } from '@/lib/auth';
import { SETUP_SQL } from '@/lib/setupSql';
import { useT } from '@/components/LanguageProvider';

type Mode = 'checking' | 'login';

export default function AdminEntry() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('checking');

  useEffect(() => {
    (async () => {
      if (await isLoggedIn()) {
        router.replace('/admin/dashboard');
        return;
      }
      setMode('login');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (mode === 'checking') return <FullPageSpinner />;
  return <LoginForm onSuccess={() => router.replace('/admin/dashboard')} />;
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

      <FirstTimeSetup />
    </Shell>
  );
}

// Collapsible first-time instructions: run the setup SQL once, then create the
// single admin user in the Supabase dashboard. No public sign-up exists, so only
// someone with Supabase access can create the admin. The steps are protected by
// a setup password so only the store owner can open them.
function FirstTimeSetup() {
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (pw === 'KEEPS') {
      setUnlocked(true);
      setErr('');
    } else {
      setErr('Incorrect password.');
    }
  }

  return (
    <div className="mt-4 rounded-theme border border-line bg-card">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
        onClick={() => setOpen((o) => !o)}
      >
        First time setting up storage?
        <ChevronDown size={16} className={`text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !unlocked && (
        <form onSubmit={unlock} className="border-t border-line px-4 py-4">
          <p className="mb-3 text-sm text-muted">Enter the setup password to continue.</p>
          <IconField icon={Lock}>
            <input
              className="input pl-9"
              type="password"
              autoFocus
              placeholder="Setup password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setErr('');
              }}
            />
          </IconField>
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          <button className="btn btn-primary mt-3 w-full">Unlock</button>
        </form>
      )}
      {open && unlocked && (
        <div className="border-t border-line px-4 py-4 text-sm text-muted">
          <ol className="space-y-3">
            <li>
              <b className="text-ink">1. Create the database.</b> Copy this SQL and run it once in your
              Supabase SQL Editor.
              <div className="mt-2 flex flex-wrap gap-2">
                <CopyButton text={SETUP_SQL} label="Copy setup SQL" className="btn btn-primary btn-sm" />
                <a
                  href="https://supabase.com/dashboard/project/_/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
                >
                  Open SQL Editor <ExternalLink size={14} />
                </a>
              </div>
            </li>
            <li>
              <b className="text-ink">2. Create your admin login.</b> In Supabase go to{' '}
              <b className="text-ink">Authentication → Users → Add user</b>, enter your email + password,
              and tick <b className="text-ink">&ldquo;Auto Confirm User&rdquo;</b>.
              <div className="mt-2">
                <a
                  href="https://supabase.com/dashboard/project/_/auth/users"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
                >
                  Open Authentication → Users <ExternalLink size={14} />
                </a>
              </div>
            </li>
            <li>
              <b className="text-ink">3. Log in above</b> with that same email + password. That&apos;s the
              only account that can manage the store — there is no public sign-up.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
