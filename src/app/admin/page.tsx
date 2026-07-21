'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, KeyRound, Store, ChevronDown, ExternalLink } from 'lucide-react';
import { SetupWizard } from '@/components/wizard/SetupWizard';
import { FullPageSpinner, Spinner } from '@/components/Spinner';
import { BrandGlow } from '@/components/BrandGlow';
import { CopyButton } from '@/components/CopyButton';
import { resolveConfig, readLocalConfig } from '@/lib/config';
import { isLoggedIn, loginWithKeys } from '@/lib/auth';
import { SETUP_SQL } from '@/lib/setupSql';
import { useT } from '@/components/LanguageProvider';

type Mode = 'checking' | 'login' | 'wizard';

// Admin entry: if logged in → dashboard. Otherwise show the key login by
// default, with a link to the guided first-time wizard.
export default function AdminEntry() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('checking');

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/admin/dashboard');
      return;
    }
    setMode('login');
  }, [router]);

  if (mode === 'checking') return <FullPageSpinner />;
  if (mode === 'wizard') return <SetupWizard />;
  return (
    <KeyLogin
      onSuccess={() => router.replace('/admin/dashboard')}
      onWizard={() => setMode('wizard')}
    />
  );
}

function KeyLogin({ onSuccess, onWizard }: { onSuccess: () => void; onWizard: () => void }) {
  const S = useT();
  const [url, setUrl] = useState('');
  const [anon, setAnon] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showSql, setShowSql] = useState(false);

  // Pre-fill the URL from an existing config so a returning owner just pastes
  // the key (or clicks straight through on their own device).
  useEffect(() => {
    const local = readLocalConfig();
    if (local) {
      setUrl(local.supabaseUrl);
      setAnon(local.supabaseAnonKey);
      return;
    }
    resolveConfig().then((c) => {
      if (c) {
        setUrl(c.supabaseUrl);
        setAnon(c.supabaseAnonKey);
      }
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const res = await loginWithKeys(url, anon);
    setBusy(false);
    if (res.ok) return onSuccess();
    setErr(res.error || 'Could not log in.');
    if (res.needsSetup) setShowSql(true);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <BrandGlow />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-[color:var(--color-primary-fg)] shadow-lg">
            <Store size={26} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{S.adminLogin}</h1>
          <p className="mt-1 text-sm text-muted">Log in with your Supabase keys</p>
        </div>

        <form onSubmit={submit} className="card p-6 shadow-xl">
          <label className="label">Project URL</label>
          <div className="relative">
            <Link2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-9"
              placeholder="https://xxxx.supabase.co"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setErr(''); }}
            />
          </div>

          <label className="label mt-3">anon public key</label>
          <div className="relative">
            <KeyRound size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted" />
            <textarea
              className="input min-h-20 pl-9 font-mono text-xs"
              placeholder="eyJhbGciOi..."
              value={anon}
              onChange={(e) => { setAnon(e.target.value); setErr(''); }}
            />
          </div>

          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

          <button className="btn btn-primary mt-5 w-full" disabled={busy}>
            {busy ? <Spinner size={18} /> : S.login}
          </button>

          <p className="mt-3 text-center text-xs text-muted">
            Supabase → Project Settings → API se ye do cheezein copy karein.
          </p>
        </form>

        {/* First time / tables missing helper */}
        <div className="mt-4 card overflow-hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
            onClick={() => setShowSql((v) => !v)}
          >
            <span>First time? Set up the store database</span>
            <ChevronDown
              size={18}
              className="transition-transform"
              style={{ transform: showSql ? 'rotate(180deg)' : 'none' }}
            />
          </button>
          {showSql && (
            <div className="border-t border-line p-4">
              <p className="mb-3 text-sm text-muted">
                Run this once in your Supabase SQL Editor to create the tables, then log in above.
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
                <button type="button" className="btn btn-outline" onClick={onWizard}>
                  Guided setup →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
