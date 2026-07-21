'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Phone, MapPin, LogOut } from 'lucide-react';
import { StoreNav } from '@/components/StoreNav';
import { StoreFooter } from '@/components/StoreFooter';
import { FullPageSpinner, Spinner } from '@/components/Spinner';
import { useConfigGuard } from '@/lib/useConfigGuard';
import { getSettings } from '@/lib/store';
import {
  getCustomer,
  signInCustomer,
  signUpCustomer,
  signOutCustomer,
  updateCustomerProfile,
} from '@/lib/customer';
import { useCustomer } from '@/components/CustomerProvider';
import { useToast } from '@/components/Toast';
import { DEFAULT_SETTINGS, type Settings } from '@/lib/types';

export default function AccountPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <AccountInner />
    </Suspense>
  );
}

function AccountInner() {
  const guard = useConfigGuard();
  const customer = useCustomer();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (guard !== 'ready') return;
    getSettings().then(setSettings);
  }, [guard]);

  if (guard !== 'ready') return <FullPageSpinner />;

  return (
    <div className="min-h-screen">
      <StoreNav settings={settings} />
      <main className="mx-auto max-w-md px-4 py-8">
        {customer ? <Profile /> : <AuthForm />}
      </main>
      <StoreFooter settings={settings} />
    </div>
  );
}

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/account';
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!email.trim() || !password) return setErr('Enter your email and password.');
    setBusy(true);
    const res =
      tab === 'signup'
        ? await signUpCustomer(email, password, name)
        : await signInCustomer(email, password);
    setBusy(false);
    if (res.ok) router.replace(redirect);
    else setErr(res.error || 'Something went wrong.');
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">{tab === 'login' ? 'Welcome back' : 'Create account'}</h1>
      <p className="mb-5 text-sm text-muted">Log in to shop and keep your cart safe across devices.</p>

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-theme border border-line bg-card p-1">
        {(['login', 'signup'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setErr('');
            }}
            className="rounded-[calc(var(--radius)-2px)] py-2 text-sm font-medium transition"
            style={
              tab === t
                ? { background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }
                : { color: 'var(--color-muted)' }
            }
          >
            {t === 'login' ? 'Log in' : 'Sign up'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="card p-6 shadow-xl">
        {tab === 'signup' && (
          <>
            <label className="label">Name</label>
            <IconInput icon={User}>
              <input className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} />
            </IconInput>
          </>
        )}
        <label className="label mt-3">Email</label>
        <IconInput icon={Mail}>
          <input
            className="input pl-9"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </IconInput>
        <label className="label mt-3">Password</label>
        <IconInput icon={Lock}>
          <input
            className="input pl-9"
            type="password"
            placeholder={tab === 'signup' ? 'At least 6 characters' : ''}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </IconInput>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <button className="btn btn-primary mt-5 w-full" disabled={busy}>
          {busy ? <Spinner size={18} /> : tab === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

function Profile() {
  const toast = useToast();
  const c = getCustomer();
  const [name, setName] = useState(c?.name ?? '');
  const [phone, setPhone] = useState(c?.phone ?? '');
  const [address, setAddress] = useState(c?.address ?? '');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const ok = await updateCustomerProfile({ name, phone, address });
    setBusy(false);
    toast(ok ? 'Profile saved' : 'Could not save', ok ? 'success' : 'error');
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-[color:var(--color-primary-fg)]">
          <User size={22} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">{c?.name || 'My account'}</h1>
          <p className="truncate text-sm text-muted">{c?.email}</p>
        </div>
      </div>

      <div className="card flex flex-col gap-3 p-5">
        <div>
          <label className="label">Name</label>
          <IconInput icon={User}>
            <input className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} />
          </IconInput>
        </div>
        <div>
          <label className="label">Phone</label>
          <IconInput icon={Phone}>
            <input
              className="input pl-9"
              inputMode="tel"
              placeholder="03xx xxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </IconInput>
        </div>
        <div>
          <label className="label">Delivery address</label>
          <IconInput icon={MapPin}>
            <textarea
              className="input min-h-20 pl-9"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </IconInput>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? <Spinner size={18} /> : 'Save profile'}
        </button>
      </div>

      <button
        className="btn btn-outline mt-4 w-full text-red-600"
        onClick={() => signOutCustomer()}
      >
        <LogOut size={16} /> Log out
      </button>
    </div>
  );
}

function IconInput({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted" />
      {children}
    </div>
  );
}
