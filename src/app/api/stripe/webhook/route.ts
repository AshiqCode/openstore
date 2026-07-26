// Stripe webhook — the ONLY place an order is marked paid.
//
// The success_url the shopper lands on proves nothing (anyone can visit it), so
// payment is only trusted when Stripe calls us here with a valid signature.
//
// Register this endpoint in Stripe WITH the trailing slash:
//   https://<your-site>/api/stripe/webhook/
// (trailingSlash is on in next.config.js, and Stripe does not follow redirects.)

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { markOrderPaid, orderIdOf } from '@/lib/markPaid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    console.error('[stripe] webhook hit but STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET is missing');
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  // The raw body is required — parsing it first would break the signature.
  const raw = await req.text();
  const stripe = new Stripe(secret);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error('[stripe] signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  // async_payment_succeeded covers delayed methods that confirm after checkout.
  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // completed also fires for sessions still awaiting funds — only 'paid' counts.
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true, ignored: session.payment_status });
  }

  const orderId = orderIdOf(session);
  if (!orderId) {
    console.error('[stripe] paid session with no order id:', session.id);
    return NextResponse.json({ received: true });
  }

  const result = await markOrderPaid(orderId, session);
  if (!result.ok) {
    // 500 makes Stripe retry, so a missed env var or a transient database error
    // doesn't silently lose a payment — it shows up as a failing webhook in the
    // Stripe dashboard instead.
    console.error('[stripe] failed to mark order paid:', orderId, result.error);
    return NextResponse.json({ error: 'Could not update the order.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
