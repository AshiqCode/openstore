// Confirms a payment when the shopper lands back on the site from Stripe.
//
// The browser cannot be trusted to say "I paid" — it only supplies a session
// id, and this route asks Stripe directly whether that session was actually
// paid, and whether it belongs to the order in question.
//
// The webhook is still the authoritative path (it fires even if the shopper
// closes the tab on Stripe's page). This route just means payment is recorded
// immediately on the normal journey, and keeps working while a store owner
// hasn't set up the webhook yet.

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { markOrderPaid, orderIdOf } from '@/lib/markPaid';
import { allow, clientKey, tooManyRequests } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Public endpoint: throttle so session ids can't be brute-forced against it.
  if (!allow(clientKey(req, 'confirm'), 20, 60_000)) return tooManyRequests();

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ paid: false, error: 'Card payments are not configured.' }, { status: 503 });
  }

  let body: { orderId?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ paid: false, error: 'Invalid request.' }, { status: 400 });
  }

  const orderId = (body.orderId || '').trim();
  const sessionId = (body.sessionId || '').trim();
  if (!orderId || !sessionId) {
    return NextResponse.json({ paid: false, error: 'Missing order or session.' }, { status: 400 });
  }

  const stripe = new Stripe(secret);

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ paid: false, error: 'Payment session not found.' }, { status: 404 });
  }

  if (orderIdOf(session) !== orderId) {
    return NextResponse.json(
      { paid: false, error: 'That payment belongs to a different order.' },
      { status: 409 }
    );
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ paid: false, status: session.payment_status });
  }

  const result = await markOrderPaid(orderId, session);
  if (!result.ok) {
    console.error('[stripe] confirm could not record payment:', orderId, result.error);
    // The money IS paid — say so, but flag that the order row wasn't updated.
    return NextResponse.json({ paid: true, recorded: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ paid: true, recorded: true });
}
