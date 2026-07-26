'use client';

// Team management from the admin panel.
//
// Reads and role changes go straight to Supabase (the database re-checks the
// caller's role). Invite and remove go through /api/team/*, because creating and
// deleting a login needs the service key, which must stay on the server.

import { getSupabase } from './supabase';

export type TeamRole = 'owner' | 'manager' | 'staff';

export type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  status: 'invited' | 'active';
  invited_by: string;
  created_at: string;
};

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  staff: 'Staff',
};

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  owner: 'Everything, including inviting and removing people',
  manager: 'Products, settings, orders and customers',
  staff: 'Orders only — cannot change the catalogue or settings',
};

export type TeamResult = {
  members: TeamMember[];
  problem: 'setup_required' | 'error' | null;
};

export async function getTeam(): Promise<TeamResult> {
  const supabase = await getSupabase();
  if (!supabase) return { members: [], problem: 'error' };

  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    // 42P01 = undefined_table: the store hasn't run the latest setup SQL.
    const missing = error.code === '42P01' || /does not exist/i.test(error.message);
    return { members: [], problem: missing ? 'setup_required' : 'error' };
  }
  return { members: (data ?? []) as TeamMember[], problem: null };
}

// The signed-in user's own role, used to hide what they can't do. The database
// enforces it regardless — this only keeps the UI honest.
export async function getMyRole(): Promise<TeamRole | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('staff_role');
  if (error) return 'owner'; // pre-team database: the only login is the owner
  return (data as TeamRole) ?? null;
}

async function authedFetch(path: string, body: unknown) {
  const supabase = await getSupabase();
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, json };
}

export type InviteResult = {
  ok: boolean;
  error?: string;
  // Present when the account was created but the EMAIL failed (e.g. Resend has
  // no verified domain yet). The owner can pass this link on by hand.
  inviteLink?: string;
};

export async function inviteMember(email: string, role: TeamRole): Promise<InviteResult> {
  const { ok, json } = await authedFetch('/api/team/invite/', { email, role });
  if (ok) return { ok: true };
  return {
    ok: false,
    error: String(json.error || 'Could not send the invite.'),
    inviteLink: typeof json.inviteLink === 'string' ? json.inviteLink : undefined,
  };
}

export async function removeMember(email: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, json } = await authedFetch('/api/team/remove/', { email });
  return ok ? { ok: true } : { ok: false, error: String(json.error || 'Could not remove them.') };
}

export async function setMemberRole(
  email: string,
  role: TeamRole
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Not connected.' };
  const { data, error } = await supabase.rpc('staff_upsert', {
    p_email: email,
    p_role: role,
    p_status: 'invited',
  });
  if (error) return { ok: false, error: error.message };
  if (data !== 'ok') return { ok: false, error: `Could not change the role (${data}).` };
  return { ok: true };
}

// Called right after an invited member sets their password.
export async function activateSelf(): Promise<void> {
  const supabase = await getSupabase();
  if (!supabase) return;
  await supabase.rpc('staff_activate_self');
}
