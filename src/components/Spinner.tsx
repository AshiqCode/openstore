'use client';

import { Loader2, ShoppingBag } from 'lucide-react';
import { useT } from '@/components/LanguageProvider';

// Small inline spinner (buttons, rows).
export function Spinner({ size = 28 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" />;
}

// Unique branded full-page loader: a spinning gradient ring with a pulsing
// shopping-bag in the centre, plus three bouncing dots.
export function FullPageSpinner({ label }: { label?: string }) {
  const S = useT();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5">
      <div className="relative h-20 w-20">
        <div className="brand-loader-ring absolute inset-0" />
        <div
          className="absolute inset-0 flex items-center justify-center text-primary"
          style={{ animation: 'loader-pulse 1.2s ease-in-out infinite' }}
        >
          <ShoppingBag size={30} />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full"
            style={{
              background: 'var(--color-primary)',
              animation: `loader-dot 1s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>

      {label && <span className="text-sm text-muted">{label}</span>}
      {!label && <span className="text-xs text-muted">{S.loading}</span>}
    </div>
  );
}
