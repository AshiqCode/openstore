'use client';

import type { Theme } from '@/lib/themes';

// A live mini mock-card rendered with a theme's own colors (no image assets).
// Used in the wizard and /admin/theme gallery so the owner previews before applying.
export function ThemeMiniCard({
  theme,
  active,
  onClick,
}: {
  theme: Theme;
  active?: boolean;
  onClick?: () => void;
}) {
  const v = theme.vars;
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left transition"
      style={{
        borderRadius: v['--radius'],
        border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
        overflow: 'hidden',
        outline: 'none',
      }}
    >
      <div style={{ background: v['--color-bg'], padding: 12 }}>
        <div
          style={{
            background: v['--color-card'],
            border: `1px solid ${v['--color-border']}`,
            borderRadius: v['--radius'],
            overflow: 'hidden',
          }}
        >
          <div style={{ height: 44, background: v['--color-primary'], opacity: 0.9 }} />
          <div style={{ padding: 10 }}>
            <div
              style={{
                height: 8,
                width: '70%',
                background: v['--color-text'],
                opacity: 0.85,
                borderRadius: 4,
              }}
            />
            <div
              style={{
                height: 6,
                width: '40%',
                background: v['--color-muted'],
                borderRadius: 4,
                marginTop: 6,
              }}
            />
            <div
              style={{
                marginTop: 10,
                height: 22,
                width: '55%',
                background: v['--color-primary'],
                color: v['--color-primary-fg'],
                borderRadius: v['--radius'],
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Buy
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            fontWeight: 600,
            color: v['--color-text'],
          }}
        >
          {theme.name}
        </div>
        <div style={{ fontSize: 10, color: v['--color-muted'] }}>{theme.vibe}</div>
      </div>
    </button>
  );
}
