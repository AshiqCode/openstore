'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type SelectOption<T extends string> = { value: T; label: string };

// Stylish dropdown that replaces the native <select> — themed, animated menu,
// checkmark on the current option, closes on outside click / Escape.
export function Select<T extends string>({
  value,
  options,
  onChange,
  icon,
  className = '',
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  icon?: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const cur = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        className="input flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="inline-flex min-w-0 items-center gap-2 truncate">
          {icon}
          <span className="truncate">{cur.label}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-full min-w-48 overflow-hidden rounded-theme border border-line bg-card p-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-[calc(var(--radius)-2px)] px-3 py-2 text-left text-sm hover:bg-bg"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              <span className="truncate">{o.label}</span>
              {value === o.value && <Check size={15} className="shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
