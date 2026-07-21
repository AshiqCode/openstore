'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// A left slide-in drawer for mobile navigation. Rendered through a portal to
// <body> with fixed positioning, so it always sits above page content and stays
// in the viewport regardless of scroll position (fixes drawers trapped inside a
// sticky header's stacking context).
export function MobileDrawer({
  open,
  onClose,
  header,
  children,
}: {
  open: boolean;
  onClose: () => void;
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="md:hidden">
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="animate-slide-in fixed left-0 top-0 z-[70] flex h-full w-72 max-w-[82%] flex-col border-r border-line bg-card shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">{header}</div>
          <button
            className="btn-icon text-muted hover:bg-bg hover:text-ink"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      </aside>
    </div>,
    document.body
  );
}
