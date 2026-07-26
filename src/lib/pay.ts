// Starts — or resumes — a card payment for an order.
//
// Used both at checkout and from order tracking, so a shopper who abandoned
// Stripe's page can come back later and finish paying the same order. The
// server recomputes every price from the database, so passing the order's own
// items here can't change what gets charged.

export type PayResult = { ok: boolean; error?: string };

export async function payForOrder(
  orderId: string,
  items: { id: string; qty: number }[],
  email?: string
): Promise<PayResult> {
  try {
    const res = await fetch('/api/checkout/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        email: email || '',
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      return { ok: false, error: data.error || 'Could not start the payment.' };
    }
    // Leaves the site — nothing after this runs.
    window.location.href = data.url;
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the payment service.' };
  }
}

// True when an order still owes money: the shopper chose card but Stripe has
// never confirmed payment (they closed the payment page, card declined, …).
export function needsPayment(order: {
  payment_method?: string;
  payment_status?: string;
  status?: string;
}): boolean {
  return (
    order.payment_method === 'card' &&
    order.payment_status !== 'paid' &&
    order.status !== 'cancelled'
  );
}
