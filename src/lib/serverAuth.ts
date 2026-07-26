// SERVER ONLY — identifies the caller of an API route from their Supabase
// session, and checks their team role.
//
// The browser sends its access token in the Authorization header. We hand that
// token to Supabase to verify (it checks the signature), then read the role from
// the staff table with the service key. Nothing the browser *claims* is trusted.

import { serviceSupabase } from './serverSupabase';

export type Caller = { email: string; role: 'owner' | 'manager' | 'staff' };
export type CallerError = { status: number; error: string };

function bearer(req: Request): string {
  const header = req.headers.get('authorization') || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}

export async function getCaller(req: Request): Promise<Caller | CallerError> {
  const token = bearer(req);
  if (!token) return { status: 401, error: 'Please log in again.' };

  const admin = serviceSupabase();
  if (!admin) {
    return { status: 503, error: 'SUPABASE_SERVICE_ROLE_KEY is not set on the server.' };
  }

  const { data, error } = await admin.auth.getUser(token);
  const email = (data?.user?.email || '').toLowerCase();
  if (error || !email) return { status: 401, error: 'Your session has expired — log in again.' };

  const { data: row } = await admin
    .from('staff')
    .select('role')
    .ilike('email', email)
    .maybeSingle();

  // No staff row = the original owner, created in the Supabase dashboard before
  // the team feature existed. Same rule as staff_role() in the database.
  const role = (row?.role as Caller['role']) || 'owner';
  return { email, role };
}

export function isCallerError(c: Caller | CallerError): c is CallerError {
  return (c as CallerError).status !== undefined;
}

export async function requireOwner(req: Request): Promise<Caller | CallerError> {
  const caller = await getCaller(req);
  if (isCallerError(caller)) return caller;
  if (caller.role !== 'owner') {
    return { status: 403, error: 'Only the owner can manage the team.' };
  }
  return caller;
}
