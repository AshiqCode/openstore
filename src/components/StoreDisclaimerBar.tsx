'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { DISCLAIMER_SHORT } from '@/lib/brand';

const KEY = 'store_disclaimer_dismissed_v1';

// A slim, visible disclaimer notice shown across the store. Dismissible, and the
// choice is remembered per browser. The footer keeps a permanent short version.
export function StoreDisclaimerBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(!localStorage.getItem(KEY));
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[12px] leading-snug text-amber-800">
      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      <span className="mx-auto max-w-5xl flex-1">{DISCLAIMER_SHORT}</span>
      <button
        className="shrink-0 rounded p-0.5 hover:bg-amber-100"
        onClick={() => {
          try {
            localStorage.setItem(KEY, '1');
          } catch {
            /* ignore */
          }
          setShow(false);
        }}
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
