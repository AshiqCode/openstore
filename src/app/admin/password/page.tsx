'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { adminChangePassword, getAdminEmail } from '@/lib/auth';
import { useT } from '@/components/LanguageProvider';

export default function PasswordPage() {
  return (
    <AdminShell>
      <ChangePassword />
    </AdminShell>
  );
}

function ChangePassword() {
  const toast = useToast();
  const S = useT();
  const [email, setEmail] = useState('');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    getAdminEmail().then(setEmail);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (next.length < 6) return setErr('New password must be at least 6 characters.');
    if (next !== confirm) return setErr('New passwords do not match.');

    setBusy(true);
    const res = await adminChangePassword(current, next);
    setBusy(false);
    if (res.ok) {
      setCurrent('');
      setNext('');
      setConfirm('');
      toast('Password changed', 'success');
    } else {
      setErr(res.error || S.errSaveFailed);
    }
  }

  return (
    <div className="max-w-md animate-fade-up">
      <h1 className="page-title mb-4">{S.changePassword}</h1>

      <form onSubmit={submit} className="card flex flex-col gap-3 p-5">
        {email && (
          <div>
            <label className="label">{S.email}</label>
            <input className="input" value={email} disabled readOnly />
          </div>
        )}
        <div>
          <label className="label">Current password</label>
          <input
            className="input"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div>
          <label className="label">New password</label>
          <input
            className="input"
            type="password"
            placeholder="At least 6 characters"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{S.confirmPassword}</label>
          <input
            className="input"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? <Spinner size={18} /> : S.changePassword}
        </button>
      </form>
    </div>
  );
}
