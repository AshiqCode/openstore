'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Reusable modal: overlay + animated panel, Esc to close, click-outside to close.
// Rendered through a portal to <body> so `position: fixed` is always relative to
// the viewport — even when an ancestor has a CSS transform (e.g. animate-fade-up),
// which would otherwise make the overlay anchor to that element instead.
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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

  const isXl = size === 'xl';
  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-lg' : 'max-w-md';

  // `xl` = a centered 90% × 90% box on every screen size (the product editor).
  // Utilities (items-center/p-4) sit in a later cascade layer than the
  // component-layer .modal-overlay, so they override its mobile bottom-sheet.
  const overlayClass = isXl ? 'modal-overlay items-center p-4' : 'modal-overlay';
  const panelClass = isXl
    ? 'modal-panel flex h-[90vh] w-[90vw] max-w-[1100px] flex-col'
    : `modal-panel modal-sheet flex max-h-[92vh] w-full flex-col ${width}`;

  return createPortal(
    <div className={overlayClass} onClick={onClose}>
      <div
        className={panelClass}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <button
              className="btn-icon text-muted hover:bg-bg hover:text-ink"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
