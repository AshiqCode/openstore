'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

// Page numbers to show, windowed so a store with 40 pages doesn't render 40
// buttons. Always the same width, so the control doesn't jump as you page.
function pageWindow(page: number, totalPages: number, span = 5): number[] {
  if (totalPages <= span) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const end = Math.min(totalPages, Math.max(page + 2, span));
  const start = Math.max(1, end - span + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({
  page,
  totalPages,
  total,
  start,
  shown,
  onChange,
  label = 'items',
}: {
  page: number;
  totalPages: number;
  total: number;
  start: number;
  shown: number;
  onChange: (page: number) => void;
  label?: string;
}) {
  // Nothing to page through — don't add furniture to a short list.
  if (totalPages <= 1) return null;

  function go(p: number) {
    const next = Math.min(totalPages, Math.max(1, p));
    if (next === page) return;
    onChange(next);
    // Paging while scrolled halfway down a long list is disorienting.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const numbers = pageWindow(page, totalPages);

  return (
    <div className="mt-4 flex flex-col items-center gap-3 border-t border-line pt-4 sm:flex-row sm:justify-between">
      <p className="text-xs text-muted">
        Showing <b className="text-ink">{start + 1}</b>–<b className="text-ink">{start + shown}</b> of{' '}
        <b className="text-ink">{total}</b> {label}
      </p>

      <div className="flex items-center gap-1">
        <button
          className="btn btn-outline btn-sm px-2"
          onClick={() => go(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {numbers[0] > 1 && <span className="px-1 text-xs text-muted">…</span>}

        {numbers.map((n) => (
          <button
            key={n}
            onClick={() => go(n)}
            aria-current={n === page ? 'page' : undefined}
            className="btn btn-sm min-w-8 justify-center px-2"
            style={
              n === page
                ? {
                    background: 'var(--color-primary)',
                    color: 'var(--color-primary-fg)',
                    borderColor: 'var(--color-primary)',
                  }
                : { background: 'transparent', border: '1px solid var(--color-border)' }
            }
          >
            {n}
          </button>
        ))}

        {numbers[numbers.length - 1] < totalPages && (
          <span className="px-1 text-xs text-muted">…</span>
        )}

        <button
          className="btn btn-outline btn-sm px-2"
          onClick={() => go(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
