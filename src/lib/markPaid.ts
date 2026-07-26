// SERVER ONLY — records a confirmed Stripe payment against an order.
//
// Two different things call this: the webhook (authoritative, fires even if the
// shopper closes the tab) and the confirm route (runs when the shopper lands
// back on the site). Both must agree, so the logic lives in one place.

import type Stripe from 'stripe';
import { serviceSupabase } from './serverSupabase';

export type MarkPaidResult = { ok: boolean; error?: string };

export async function markOrderPaid(
  orderId: string,
  session: Stripe.Checkout.Session
): Promise<MarkPaidResult> {
  const supabase = serviceSupabase();
  if (!supabase) {
    return {
      ok: false,
      error:
        'SUPABASE_SERVICE_ROLE_KEY is not set, so the payment could not be recorded. Add it to your environment variables.',
    };
  }

  // Only the PAYMENT state changes here. `status` is the seller's fulfilment
  // workflow (pending → confirmed → delivered) and stays 'pending' so the admin
  // still reviews and advances the order by hand — money arriving is not the
  // same as the seller accepting the order.
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      payment_method: 'card',
      stripe_session_id: session.id,
    })
    .eq('id', orderId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// The order a Checkout Session was created for. Checking this stops a real paid
// session id from being replayed to mark some *other* order as paid.
export function orderIdOf(session: Stripe.Checkout.Session): string | null {
  return session.metadata?.order_id || session.client_reference_id || null;
}
