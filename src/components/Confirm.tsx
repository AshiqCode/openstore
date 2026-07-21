'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

// Promise-based confirm dialog — a drop-in replacement for window.confirm().
// Usage: const confirm = useConfirm(); if (await confirm({title})) { ... }
export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [busy, setBusy] = useState(false);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setOpts(options);
    setBusy(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function settle(result: boolean) {
    resolver.current?.(result);
    resolver.current = null;
    setOpts(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!opts} onClose={() => settle(false)} size="sm">
        {opts && (
          <div>
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: opts.danger
                    ? 'rgba(220,38,38,0.12)'
                    : 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                  color: opts.danger ? '#dc2626' : 'var(--color-primary)',
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight">{opts.title}</h2>
                {opts.message && <p className="mt-1 text-sm text-muted">{opts.message}</p>}
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button className="btn btn-outline flex-1" onClick={() => settle(false)} disabled={busy}>
                {opts.cancelLabel || 'Cancel'}
              </button>
              <button
                className={`flex-1 ${opts.danger ? 'btn btn-danger' : 'btn btn-primary'}`}
                onClick={() => settle(true)}
                disabled={busy}
              >
                {busy ? <Spinner size={18} /> : opts.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}
