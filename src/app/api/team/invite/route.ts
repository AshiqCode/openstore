// Invites someone to the admin panel with a role.
//
// Uses Supabase's OFFICIAL invite API — auth.admin.inviteUserByEmail() — which
// creates the Auth user and sends the invitation email through whatever SMTP the
// Supabase project is configured with (Dashboard → Authentication → Emails).
// Being a real Auth user is what makes row-level security work for them.
//
// If Supabase can't send the email (no custom SMTP yet, or its built-in sender
// is rate-limited), we fall back to generating the same one-time link and handing
// it back so the owner can deliver it themselves. The invite still works.
//
// The role is written by staff_upsert(), which re-checks in the database that the
// caller is the owner.

import { NextResponse } from 'next/server';
import { serviceSupabase } from '@/lib/serverSupabase';
import { requireOwner, isCallerError } from '@/lib/serverAuth';
import { allow, clientKey, tooManyRequests } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROLES = ['owner', 'manager', 'staff'] as const;
type Role = (typeof ROLES)[number];

// Supabase surfaces a mail-transport problem in several shapes; any of these
// means "the account is fine, the email didn't go out".
function isEmailDeliveryProblem(message: string): boolean {
  return /smtp|email|mail|rate limit|too many requests|not confirmed|send/i.test(message);
}

export async function POST(req: Request) {
  // Throttled ahead of the auth check so unauthenticated probing is cheap to
  // absorb, and so a stolen session can't be used to blast out invitations.
  if (!allow(clientKey(req, 'team-invite'), 6, 60_000)) return tooManyRequests();

  const caller = await requireOwner(req);
  if (isCallerError(caller)) {
    return NextResponse.json({ error: caller.error }, { status: caller.status });
  }

  let body: { email?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const role = (body.role || 'staff') as Role;

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: 'Unknown role.' }, { status: 400 });
  }
  if (email === caller.email) {
    return NextResponse.json({ error: "That's your own account." }, { status: 400 });
  }

  const admin = serviceSupabase();
  if (!admin) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is not set on the server.' },
      { status: 503 }
    );
  }

  const origin =
    req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const redirectTo = `${origin}/admin/accept-invite/`;

  // ---- 1. Save the role first --------------------------------------------
  // Doing this before creating the account means a failed invite never leaves
  // an Auth user with no role attached.
  const { data: upsert, error: upsertError } = await admin.rpc('staff_upsert', {
    p_email: email,
    p_role: role,
    p_status: 'invited',
  });
  if (upsertError || upsert !== 'ok') {
    console.error('[team] staff_upsert failed:', upsertError?.message ?? upsert);
    return NextResponse.json(
      { error: upsertError?.message || `Could not save the role (${upsert}).` },
      { status: 502 }
    );
  }

  // ---- 2. Supabase's official invite -------------------------------------
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (!inviteError) {
    return NextResponse.json({ ok: true, email, role, sentBy: 'supabase' });
  }

  const message = inviteError.message || 'Could not send the invitation.';
  console.error('[team] inviteUserByEmail failed:', inviteError.status, message);

  // Already has a login — they don't need an invite, just a role, which is
  // already saved above.
  if (/already been registered|already registered|already exists/i.test(message)) {
    return NextResponse.json(
      {
        error: `${email} already has a login, so no invitation was needed. Their role is set to ${role}.`,
        roleSaved: true,
      },
      { status: 409 }
    );
  }

  // ---- 3. Email failed → hand back the same one-time link -----------------
  if (isEmailDeliveryProblem(message)) {
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo },
    });

    if (!linkError && linkData?.properties?.action_link) {
      return NextResponse.json(
        {
          error: `Supabase could not send the email (${message}). Set up SMTP in Supabase → Authentication → Emails, or just send this link yourself — it works exactly the same.`,
          roleSaved: true,
          inviteLink: linkData.properties.action_link,
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ error: message, roleSaved: true }, { status: 502 });
}
