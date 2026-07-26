'use client';

import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';

const KEY = 'announcement_dismissed';

// Stable id for a message, so dismissing one announcement doesn't hide the
// next one the owner writes — a new text produces a new id and shows again.
function messageId(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return String(h);
}

// Thin strip above the header for store-wide notices (sales, delivery news).
// Driven by the `banner_text` setting; empty text = no strip.
export function AnnouncementBar({ text }: { text: string }) {
  const message = (text || '').trim();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // localStorage is only available client-side; wait for it so the strip
  // doesn't flash for someone who already closed it.
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(KEY));
    } catch {
      /* private mode — just show it */
    }
    setReady(true);
  }, []);

  if (!message || !ready || dismissed === messageId(message)) return null;

  function dismiss() {
    const id = messageId(message);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
    setDismissed(id);
  }

  return (
    <div
      role="status"
      className="relative w-full"
      style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-10 py-2">
        <Megaphone size={15} className="shrink-0 opacity-90" />
        <p className="text-center text-[13px] font-medium leading-snug sm:text-sm">{message}</p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 opacity-75 transition hover:opacity-100"
      >
        <X size={15} />
      </button>
    </div>
  );
}
