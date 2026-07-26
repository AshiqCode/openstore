// Removes someone from the team: deletes their role row AND their Supabase Auth
// user, so they can no longer log in at all. Deleting an Auth user needs the
// Admin API, hence the service key and this route.

import { NextResponse } from 'next/server';
import { serviceSupabase } from '@/lib/serverSupabase';
import { requireOwner, isCallerError } from '@/lib/serverAuth';
import { allow, clientKey, tooManyRequests } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!allow(clientKey(req, 'team-remove'), 10, 60_000)) return tooManyRequests();

  const caller = await requireOwner(req);
  if (isCallerError(caller)) {
    return NextResponse.json({ error: caller.error }, { status: caller.status });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Missing email.' }, { status: 400 });
  if (email === caller.email) {
    return NextResponse.json(
      { error: "You can't remove your own account." },
      { status: 400 }
    );
  }

  const admin = serviceSupabase();
  if (!admin) return NextResponse.json({ error: 'Server is not configured.' }, { status: 503 });

  // Drop the role first — assert_owner() runs in the database as a second check.
  const { data: removed, error: removeError } = await admin.rpc('staff_remove', {
    p_email: email,
  });
  if (removeError) {
    return NextResponse.json({ error: removeError.message }, { status: 502 });
  }
  if (removed === 'cannot_remove_self') {
    return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });
  }

  // Then revoke the login itself. Finding the user needs a listing — Supabase
  // has no lookup-by-email admin call.
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = (list?.users ?? []).find((u) => (u.email || '').toLowerCase() === email);

  if (user) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      // The role is gone, so they have no permissions, but they can still sign
      // in — the owner needs to know that rather than assume it's finished.
      return NextResponse.json(
        {
          error: `Role removed, but their login could not be deleted: ${deleteError.message}`,
          roleRemoved: true,
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ ok: true, email, loginDeleted: !!user });
}
