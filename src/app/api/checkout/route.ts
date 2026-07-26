// Creates a Stripe Checkout Session for a card order.
//
// SECURITY: the browser only ever sends product ids + quantities. Every price,
// the delivery charge and the total are recomputed here from the database, so a
// shopper editing the request can't buy a Rs. 5000 item for Rs. 5.

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { serverSupabase } from '@/lib/serverSupabase';
import { DEFAULT_SETTINGS, effectivePrice, type Product, type Settings } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stripe expects the smallest unit (paisa, cents) — except for currencies that
// have no minor unit at all, where the amount is the plain number.
const ZERO_DECIMAL = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
  'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
]);

function toMinorUnits(amount: number, currency: string): number {
  return ZERO_DECIMAL.has(currency) ? Math.round(amount) : Math.round(amount * 100);
}

// Lets the checkout page know whether to offer the card option at all: no key
// configured (e.g. a fork that only wants cash on delivery) → no card button.
export function GET() {
  return NextResponse.json({ enabled: !!process.env.STRIPE_SECRET_KEY });
}

type Line = { id: string; qty: number };

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Card payments are not configured.' }, { status: 503 });
  }

  let body: { orderId?: string; items?: Line[]; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const orderId = (body.orderId || '').trim();
  const wanted = (body.items || [])
    .filter((l) => l && typeof l.id === 'string')
    .map((l) => ({ id: l.id, qty: Math.min(999, Math.max(1, Math.floor(Number(l.qty) || 0))) }));

  if (!orderId || wanted.length === 0) {
    return NextResponse.json({ error: 'Nothing to pay for.' }, { status: 400 });
  }

  const supabase = serverSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Store is not configured.' }, { status: 503 });
  }

  // Settings — currency, delivery, store name (all publicly readable).
  const settings: Settings = { ...DEFAULT_SETTINGS };
  const { data: settingRows } = await supabase.from('settings').select('key, value');
  for (const row of (settingRows ?? []) as { key: string; value: string }[]) {
    if (row.key in settings) (settings as Record<string, string>)[row.key] = row.value ?? '';
  }

  if (settings.store_open === 'false') {
    return NextResponse.json({ error: 'The store is closed right now.' }, { status: 409 });
  }

  // Real prices, straight from the products table.
  const { data: productRows, error: productErr } = await supabase
    .from('products')
    .select('*')
    .in('id', wanted.map((l) => l.id))
    .eq('is_active', true);

  if (productErr) {
    return NextResponse.json({ error: 'Could not load products.' }, { status: 502 });
  }

  const byId = new Map((productRows ?? []).map((p) => [(p as Product).id, p as Product]));
  const currency = (settings.currency_code || 'pkr').trim().toLowerCase();

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let subtotal = 0;

  for (const line of wanted) {
    const product = byId.get(line.id);
    if (!product) {
      return NextResponse.json(
        { error: 'A product in your cart is no longer available.' },
        { status: 409 }
      );
    }
    const unit = effectivePrice(product);
    subtotal += unit * line.qty;
    lineItems.push({
      quantity: line.qty,
      price_data: {
        currency,
        unit_amount: toMinorUnits(unit, currency),
        product_data: {
          name: product.name,
          // Stripe rejects empty strings here, so only send real images.
          ...(product.image_url ? { images: [product.image_url] } : {}),
        },
      },
    });
  }

  // Delivery, using the same free-over rule the cart shows.
  const freeOver = Number(settings.free_delivery_over || 0);
  const baseDelivery = Number(settings.delivery_charges || 0);
  const delivery = freeOver > 0 && subtotal >= freeOver ? 0 : baseDelivery;
  if (delivery > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: toMinorUnits(delivery, currency),
        product_data: { name: 'Delivery' },
      },
    });
  }

  // Where Stripe sends the shopper back. Prefer the origin the request actually
  // came from so previews and custom domains both work.
  const origin =
    req.headers.get('origin') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(req.url).origin;

  const stripe = new Stripe(secret);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      // Both are set so the webhook can find the order either way.
      client_reference_id: orderId,
      metadata: { order_id: orderId },
      ...(body.email ? { customer_email: body.email } : {}),
      // {CHECKOUT_SESSION_ID} is substituted by Stripe. The page hands it to
      // /api/checkout/confirm, which asks Stripe whether it was really paid.
      success_url: `${origin}/checkout/?paid=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/?canceled=1`,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a payment page.' }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Surface Stripe's own message (bad key, unsupported currency, …) — it is
    // far more useful to the store owner than a generic failure.
    const message = err instanceof Error ? err.message : 'Could not start the payment.';
    console.error('[stripe] checkout session failed:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
