'use client';

import { Banknote, CreditCard } from 'lucide-react';

// One source of truth for how a payment method is shown, so the seller (Admin →
// Orders) and the shopper (Track & order history) always read the same words.
//
// Orders placed before card payments existed have no payment_method — they were
// all cash on delivery, so that's the correct fallback.
const TONES = {
  neutral: { background: 'rgba(100,116,139,0.15)', color: '#475569' },
  good: { background: 'rgba(22,163,74,0.15)', color: '#15803d' },
  warn: { background: 'rgba(245,158,11,0.15)', color: '#b45309' },
} as const;

export function PaymentBadge({
  order,
}: {
  order: { payment_method?: string; payment_status?: string };
}) {
  const card = order.payment_method === 'card';
  const paid = order.payment_status === 'paid';

  const tone = !card ? 'neutral' : paid ? 'good' : 'warn';
  const label = !card ? 'Cash on delivery' : paid ? 'Paid online' : 'Online — unpaid';
  const Icon = card ? CreditCard : Banknote;

  return (
    <span className="badge" style={TONES[tone]}>
      <Icon size={12} /> {label}
    </span>
  );
}
