'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { DISCLAIMER_LONG } from '@/lib/brand';

const ACK_KEY = 'disclaimer_ack_v1';

// One-time warning shown on first visit. The visitor must acknowledge it; the
// choice is remembered so it doesn't nag on every load.
export function DisclaimerNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ACK_KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(ACK_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  return (
    <Modal open={open} onClose={accept} size="sm">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-lg font-bold">Please note</h2>
        <p className="mt-2 text-left text-sm leading-relaxed text-muted">{DISCLAIMER_LONG}</p>
        <button className="btn btn-primary mt-5 w-full" onClick={accept}>
          I understand &amp; agree
        </button>
      </div>
    </Modal>
  );
}
