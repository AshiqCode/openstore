'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import { Select } from '@/components/Select';
import { CopyButton } from '@/components/CopyButton';
import { SETUP_SQL } from '@/lib/setupSql';
import { getAdminEmail } from '@/lib/auth';
import { shortDate } from '@/lib/format';
import {
  getTeam,
  getMyRole,
  inviteMember,
  removeMember,
  setMemberRole,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type TeamMember,
  type TeamRole,
} from '@/lib/team';
import {
  UsersRound,
  UserPlus,
  Trash2,
  Mail,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Clock,
} from 'lucide-react';

export default function TeamPage() {
  return (
    <AdminShell>
      <Team />
    </AdminShell>
  );
}

const ROLE_OPTIONS = (['manager', 'staff', 'owner'] as TeamRole[]).map((r) => ({
  value: r,
  label: `${ROLE_LABELS[r]} — ${ROLE_DESCRIPTIONS[r]}`,
}));

function Team() {
  const toast = useToast();
  const confirm = useConfirm();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [problem, setProblem] = useState<'setup_required' | 'error' | null>(null);
  const [myRole, setMyRole] = useState<TeamRole | null>(null);
  const [myEmail, setMyEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('staff');
  const [inviting, setInviting] = useState(false);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  // Set when the account was created but the email couldn't be delivered.
  const [fallback, setFallback] = useState<{ email: string; link: string; reason: string } | null>(
    null
  );

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const [team, r, mine] = await Promise.all([getTeam(), getMyRole(), getAdminEmail()]);
    setMembers(team.members);
    setProblem(team.problem);
    setMyRole(r);
    setMyEmail((mine || '').toLowerCase());
    setLoading(false);
  }

  const isOwner = myRole === 'owner';

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const target = email.trim().toLowerCase();
    if (!target || !target.includes('@')) {
      toast('Enter a valid email address.', 'error');
      return;
    }
    setInviting(true);
    setFallback(null);
    const res = await inviteMember(target, role);
    setInviting(false);

    if (res.ok) {
      setEmail('');
      toast(`Invitation sent to ${target}`, 'success');
      void load();
      return;
    }

    // The account exists and the role is saved — only the email failed. Hand the
    // owner the link so they can send it themselves instead of being stuck.
    if (res.inviteLink) {
      setEmail('');
      setFallback({
        email: target,
        link: res.inviteLink,
        reason: res.error || 'The email could not be sent.',
      });
    } else {
      toast(res.error || 'Could not send the invite.', 'error');
    }
    void load();
  }

  async function changeRole(m: TeamMember, next: TeamRole) {
    setBusyEmail(m.email);
    const res = await setMemberRole(m.email, next);
    setBusyEmail(null);
    if (res.ok) {
      setMembers((list) => list.map((x) => (x.email === m.email ? { ...x, role: next } : x)));
      toast(`${m.email} is now ${ROLE_LABELS[next]}`, 'success');
    } else toast(res.error || 'Could not change the role.', 'error');
  }

  async function remove(m: TeamMember) {
    const ok = await confirm({
      title: `Remove ${m.email}?`,
      message:
        'Their role and their login are both deleted, so they lose access immediately. Orders and products they worked on are untouched.',
      confirmLabel: 'Remove person',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;

    setBusyEmail(m.email);
    const res = await removeMember(m.email);
    setBusyEmail(null);
    if (res.ok) {
      setMembers((list) => list.filter((x) => x.email !== m.email));
      toast('Person removed', 'success');
    } else toast(res.error || 'Could not remove them.', 'error');
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Spinner size={18} /> Loading…
      </div>
    );
  }

  if (problem === 'setup_required') {
    return (
      <div className="animate-fade-up">
        <Heading />
        <div className="card p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 text-amber-600">
              <AlertTriangle size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold">One database update needed</h2>
              <p className="mt-1 text-sm text-muted">
                Team accounts need a <span className="font-mono text-xs">staff</span> table your
                database doesn&apos;t have yet. Copy the setup SQL, run it once in Supabase — it is
                safe to re-run — then reload.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton text={SETUP_SQL} label="Copy setup SQL" className="btn btn-primary btn-sm" />
                <a
                  href="https://supabase.com/dashboard/project/_/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
                >
                  Open SQL Editor <ExternalLink size={14} />
                </a>
                <button className="btn btn-outline btn-sm" onClick={() => void load()}>
                  Reload
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="animate-fade-up">
        <Heading />
        <div className="card p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg text-muted">
            <ShieldCheck size={22} />
          </div>
          <p className="font-medium">Only the owner can manage the team</p>
          <p className="mt-1 text-sm text-muted">
            You&apos;re signed in as <b className="text-ink">{ROLE_LABELS[myRole ?? 'staff']}</b>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up pb-10">
      <Heading />

      {/* Invite */}
      <form onSubmit={invite} className="card mb-5 p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <UserPlus size={17} className="text-primary" /> Invite someone
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="label">Email address</label>
            <input
              className="input"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="sm:w-64">
            <label className="label">Role</label>
            <Select
              value={role}
              onChange={(v) => setRole(v as TeamRole)}
              options={ROLE_OPTIONS}
            />
          </div>
          <button className="btn btn-primary shrink-0" disabled={inviting}>
            {inviting ? <Spinner size={18} /> : <><Mail size={16} /> Send invite</>}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          They get an email with a one-time link to set their own password. You never see or set it.
        </p>
      </form>

      {/* Email failed, account created — let the owner deliver the link manually. */}
      {fallback && (
        <div className="card mb-5 border-amber-300 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 text-amber-600">
              <AlertTriangle size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">
                Account created for {fallback.email} — but the email didn&apos;t send
              </h2>
              <p className="mt-1 text-sm text-muted">{fallback.reason}</p>
              <p className="mt-2 text-sm text-muted">
                Their role is saved. Send them this one-time link yourself (WhatsApp, SMS, anything)
                and it works exactly the same:
              </p>
              <div className="mt-2 break-all rounded-theme border border-line bg-bg p-2 font-mono text-xs">
                {fallback.link}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <CopyButton
                  text={fallback.link}
                  label="Copy invite link"
                  className="btn btn-primary btn-sm"
                />
                <button className="btn btn-outline btn-sm" onClick={() => setFallback(null)}>
                  Dismiss
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">
                Treat it like a password — anyone with this link can set the account&apos;s password.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="flex flex-col gap-3">
        {members.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg text-muted">
              <UsersRound size={22} />
            </div>
            <p className="font-medium">Just you so far</p>
            <p className="mt-1 text-sm text-muted">
              Invite someone above and they&apos;ll appear here.
            </p>
          </div>
        ) : (
          members.map((m) => {
            const isMe = m.email.toLowerCase() === myEmail;
            return (
              <div key={m.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{m.name || m.email}</span>
                      {isMe && (
                        <span
                          className="badge"
                          style={{ background: 'rgba(100,116,139,0.15)', color: '#475569' }}
                        >
                          You
                        </span>
                      )}
                      {m.status === 'invited' ? (
                        <span
                          className="badge"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#b45309' }}
                        >
                          <Clock size={12} /> Invite pending
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{ background: 'rgba(22,163,74,0.15)', color: '#15803d' }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    {m.name && <div className="text-sm text-muted">{m.email}</div>}
                    <div className="mt-1 text-xs text-muted">
                      Added {shortDate(m.created_at)}
                      {m.invited_by ? ` by ${m.invited_by}` : ''}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-40">
                      <Select
                        value={m.role}
                        onChange={(v) => changeRole(m, v as TeamRole)}
                        options={(['owner', 'manager', 'staff'] as TeamRole[]).map((r) => ({
                          value: r,
                          label: ROLE_LABELS[r],
                        }))}
                      />
                    </div>
                    <button
                      className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
                      style={isMe ? undefined : { color: '#dc2626', borderColor: 'rgba(220,38,38,0.4)' }}
                      onClick={() => remove(m)}
                      disabled={isMe || busyEmail === m.email}
                      title={isMe ? "You can't remove your own account" : 'Remove this person'}
                    >
                      {busyEmail === m.email ? <Spinner size={15} /> : <Trash2 size={15} />} Remove
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted">{ROLE_DESCRIPTIONS[m.role]}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Heading() {
  return (
    <>
      <h1 className="page-title mb-1 flex items-center gap-2">
        <UsersRound size={22} className="text-primary" /> Team
      </h1>
      <p className="mb-4 text-sm text-muted">
        People who can sign in to this admin panel, and what each of them is allowed to do.
      </p>
    </>
  );
}
