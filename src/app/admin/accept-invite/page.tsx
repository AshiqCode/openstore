'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Store, ShieldCheck } from 'lucide-react';
import { FullPageSpinner, Spinner } from '@/components/Spinner';
import { BrandGlow } from '@/components/BrandGlow';
import { getSupabase } from '@/lib/supabase';
import { activateSelf } from '@/lib/team';

type Stage = 'checking' | 'set-password' | 'bad-link' | 'done';

export default function AcceptInvitePage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [linkError, setLinkError] = useState('');

  // The Supabase client is created with detectSessionInUrl: false (product pages
  // use ?id= query params), so the invite link's tokens are NOT picked up
  // automatically — we read them out of the URL fragment ourselves.
  useEffect(() => {
    (async () => {
      const supabase = await getSupabase();
      if (!supabase) {
        setLinkError('This store is not connected to Supabase yet.');
        setStage('bad-link');
        return;
      }

      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const query = new URLSearchParams(window.location.search);

      const description = hash.get('error_description') || query.get('error_description');
      if (description) {
        setLinkError(description.replace(/\+/g, ' '));
        setStage('bad-link');
        return;
      }

      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // Don't leave the tokens sitting in the address bar or in history.
        window.history.replaceState({}, '', '/admin/accept-invite/');
        if (error) {
          setLinkError(error.message);
          setStage('bad-link');
          return;
        }
        setEmail(data.session?.user?.email ?? '');
        setStage('set-password');
        return;
      }

      // No tokens — but they may already be signed in (e.g. refreshed the page).
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setEmail(data.session.user?.email ?? '');
        setStage('set-password');
        return;
      }

      setLinkError('This invitation link is missing its token, or it has already been used.');
      setStage('bad-link');
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (password.length < 6) return setErr('Password must be at least 6 characters.');
    if (password !== confirmPw) return setErr('The two passwords do not match.');

    setBusy(true);
    const supabase = await getSupabase();
    const { error } = (await supabase?.auth.updateUser({ password })) ?? {
      error: { message: 'Not connected.' },
    };
    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }

    // Flip their team row from "invite pending" to active.
    await activateSelf();
    setBusy(false);
    setStage('done');
    router.replace('/admin/dashboard');
  }

  if (stage === 'checking' || stage === 'done') return <FullPageSpinner />;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <BrandGlow />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-[color:var(--color-primary-fg)] shadow-lg">
            {stage === 'bad-link' ? <ShieldCheck size={26} /> : <Store size={26} />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {stage === 'bad-link' ? 'This link cannot be used' : 'Choose your password'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {stage === 'bad-link'
              ? 'Ask the store owner to send you a fresh invitation.'
              : email
                ? `Setting up ${email}`
                : 'Set a password to finish setting up your account'}
          </p>
        </div>

        {stage === 'bad-link' ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-muted">{linkError}</p>
            <a href="/admin/" className="btn btn-outline mt-5 w-full">
              Go to the login page
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="card p-6 shadow-xl">
            <label className="label">New password</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted" />
              <input
                className="input pl-9"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErr('');
                }}
              />
            </div>

            <label className="label mt-3">Confirm password</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted" />
              <input
                className="input pl-9"
                type="password"
                value={confirmPw}
                onChange={(e) => {
                  setConfirmPw(e.target.value);
                  setErr('');
                }}
              />
            </div>

            {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

            <button className="btn btn-primary mt-5 w-full" disabled={busy}>
              {busy ? <Spinner size={18} /> : 'Save password and continue'}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              Only you ever see this password — the owner cannot read it.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
