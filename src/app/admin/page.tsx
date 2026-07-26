'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Store } from 'lucide-react';
import { FullPageSpinner, Spinner } from '@/components/Spinner';
import { BrandGlow } from '@/components/BrandGlow';
import { isLoggedIn, adminLogin } from '@/lib/auth';
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
    </Shell>
  );
}
