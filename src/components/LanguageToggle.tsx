'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { LANGUAGES, type Lang } from '@/lib/strings';
import { useLang } from '@/components/LanguageProvider';

// Language selector dropdown: English (default), Roman Urdu, Urdu.
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        className="btn btn-outline gap-1.5 px-3 py-2 text-sm"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
      >
        <Globe size={16} />
        <span className="hidden sm:inline">{current.native}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-theme border border-line bg-card p-1 shadow-lg">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-[calc(var(--radius)-2px)] px-3 py-2 text-left text-sm hover:bg-bg"
              onClick={() => {
                setLang(l.code as Lang);
                setOpen(false);
              }}
            >
              <span>
                {l.label}
                {l.native !== l.label && <span className="ml-1 text-muted">({l.native})</span>}
              </span>
              {lang === l.code && <Check size={15} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
