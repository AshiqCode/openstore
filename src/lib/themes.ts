// The 18 built-in themes. Each is a set of CSS-variable values applied to
// <html data-theme="..."> — switching is instant, no rebuild.
//
// Tailwind maps these variables to color utilities (see tailwind.config.ts),
// so `bg-primary`, `text-ink`, `rounded-theme` etc. re-skin automatically.

export type ThemeVars = {
  '--color-primary': string;
  '--color-primary-fg': string; // text/icon color that sits on primary
  '--color-bg': string;
  '--color-card': string;
  '--color-text': string;
  '--color-muted': string;
  '--color-border': string;
  '--radius': string;
  '--font-heading': string;
  '--font-body': string;
  // 'sharp' | 'soft' | 'pill' — controls button shape via a class hook.
  '--btn-style': string;
};

export type Theme = {
  id: string;
  name: string;
  vibe: string;
  vars: ThemeVars;
};

const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

export const THEMES: Theme[] = [
  {
    id: 'clean',
    name: 'Clean',
    vibe: 'White, minimal, sharp — default',
    vars: {
      '--color-primary': '#111827',
      '--color-primary-fg': '#ffffff',
      '--color-bg': '#ffffff',
      '--color-card': '#ffffff',
      '--color-text': '#111827',
      '--color-muted': '#6b7280',
      '--color-border': '#e5e7eb',
      '--radius': '6px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'sharp',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    vibe: 'Soft pink, rounded — boutique',
    vars: {
      '--color-primary': '#e11d73',
      '--color-primary-fg': '#ffffff',
      '--color-bg': '#fff5f8',
      '--color-card': '#ffffff',
      '--color-text': '#4a1230',
      '--color-muted': '#9d6b81',
      '--color-border': '#f6d6e2',
      '--radius': '16px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'soft',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    vibe: 'Dark bg, neon accent — streetwear/tech',
    vars: {
      '--color-primary': '#22d3ee',
      '--color-primary-fg': '#04121a',
      '--color-bg': '#0b0f17',
      '--color-card': '#131a26',
      '--color-text': '#e6edf3',
      '--color-muted': '#8b97a7',
      '--color-border': '#232c3b',
      '--radius': '10px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'soft',
    },
  },
  {
    id: 'desi',
    name: 'Desi',
    vibe: 'Warm orange/green, festive — food/ethnic wear',
    vars: {
      '--color-primary': '#e2711d',
      '--color-primary-fg': '#ffffff',
      '--color-bg': '#fffaf0',
      '--color-card': '#ffffff',
      '--color-text': '#2f3b1f',
      '--color-muted': '#7c7a5a',
      '--color-border': '#efe2c6',
      '--radius': '12px',
      '--font-heading': SERIF,
      '--font-body': SANS,
      '--btn-style': 'soft',
    },
  },
  {
    id: 'luxe',
    name: 'Luxe',
    vibe: 'Black + gold, serif headings — premium',
    vars: {
      '--color-primary': '#c9a227',
      '--color-primary-fg': '#0a0a0a',
      '--color-bg': '#0a0a0a',
      '--color-card': '#161616',
      '--color-text': '#f4f0e6',
      '--color-muted': '#a99f86',
      '--color-border': '#2a2a2a',
      '--radius': '2px',
      '--font-heading': SERIF,
      '--font-body': SANS,
      '--btn-style': 'sharp',
    },
  },
  {
    id: 'mint',
    name: 'Mint',
    vibe: 'Fresh green/white — organic, skincare',
    vars: {
      '--color-primary': '#0f9d6e',
      '--color-primary-fg': '#ffffff',
      '--color-bg': '#f3fbf7',
      '--color-card': '#ffffff',
      '--color-text': '#123a2c',
      '--color-muted': '#5f8577',
      '--color-border': '#d4ede2',
      '--radius': '14px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'pill',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    vibe: 'Blue/teal, calm — general retail',
    vars: {
      '--color-primary': '#0e7ec7',
      '--color-primary-fg': '#ffffff',
      '--color-bg': '#f2f8fc',
      '--color-card': '#ffffff',
      '--color-text': '#0e2a3d',
      '--color-muted': '#5c7a8c',
      '--color-border': '#d3e6f1',
      '--radius': '10px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'soft',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    vibe: 'Coral/amber accents — youth brands',
    vars: {
      '--color-primary': '#f4623a',
      '--color-primary-fg': '#ffffff',
      '--color-bg': '#fff6f2',
      '--color-card': '#ffffff',
      '--color-text': '#3a2016',
      '--color-muted': '#9a7264',
      '--color-border': '#f7ddd0',
      '--radius': '18px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'pill',
    },
  },
  {
    id: 'mono',
    name: 'Mono',
    vibe: 'Grayscale, bold typography — art/prints',
    vars: {
      '--color-primary': '#000000',
      '--color-primary-fg': '#ffffff',
      '--color-bg': '#fafafa',
      '--color-card': '#ffffff',
      '--color-text': '#0a0a0a',
      '--color-muted': '#737373',
      '--color-border': '#dcdcdc',
      '--radius': '0px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'sharp',
    },
  },
  {
    id: 'eid',
    name: 'Eid',
    vibe: 'Emerald + cream, seasonal',
    vars: {
      '--color-primary': '#046a4e',
      '--color-primary-fg': '#fdf6e3',
      '--color-bg': '#fbf6e9',
      '--color-card': '#ffffff',
      '--color-text': '#1c3a2c',
      '--color-muted': '#6f7d64',
      '--color-border': '#e6dcc0',
      '--radius': '10px',
      '--font-heading': SERIF,
      '--font-body': SANS,
      '--btn-style': 'soft',
    },
  },
  {
    id: 'grape',
    name: 'Grape',
    vibe: 'Deep violet, elegant — beauty, cosmetics',
    vars: {
      '--color-primary': '#7c3aed',
      '--color-primary-fg': '#ffffff',
      '--color-bg': '#faf7ff',
      '--color-card': '#ffffff',
      '--color-text': '#2a1a4a',
      '--color-muted': '#7c6a9c',
      '--color-border': '#e7ddf7',
      '--radius': '14px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'soft',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    vibe: 'Dark green, earthy — outdoor, handmade',
    vars: {
      '--color-primary': '#4ade80',
      '--color-primary-fg': '#052012',
      '--color-bg': '#0c1711',
      '--color-card': '#14231a',
      '--color-text': '#e5f2ea',
      '--color-muted': '#86a394',
      '--color-border': '#23362b',
      '--radius': '10px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'soft',
    },
  },
  {
    id: 'mocha',
    name: 'Mocha',
    vibe: 'Brown & cream, cozy — cafe, bakery',
    vars: {
      '--color-primary': '#8a5a2b',
      '--color-primary-fg': '#ffffff',
      '--color-bg': '#f7f1e8',
      '--color-card': '#fffdf9',
      '--color-text': '#3a2a1c',
      '--color-muted': '#8a7660',
      '--color-border': '#e6d8c4',
      '--radius': '12px',
      '--font-heading': SERIF,
      '--font-body': SANS,
      '--btn-style': 'soft',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    vibe: 'Cool gray-blue, professional — B2B, services',
    vars: {
      '--color-primary': '#334155',
      '--color-primary-fg': '#ffffff',
      '--color-bg': '#f8fafc',
      '--color-card': '#ffffff',
      '--color-text': '#1e293b',
      '--color-muted': '#64748b',
      '--color-border': '#e2e8f0',
      '--radius': '8px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'sharp',
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    vibe: 'Cyberpunk magenta on black — gaming, streetwear',
    vars: {
      '--color-primary': '#ff2d95',
      '--color-primary-fg': '#12010a',
      '--color-bg': '#0a0410',
      '--color-card': '#150a1e',
      '--color-text': '#f3e9f7',
      '--color-muted': '#a487b3',
      '--color-border': '#2b1638',
      '--radius': '6px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'sharp',
    },
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    vibe: 'Clay & sand, warm — pottery, home decor',
    vars: {
      '--color-primary': '#c1642d',
      '--color-primary-fg': '#ffffff',
      '--color-bg': '#faf3ea',
      '--color-card': '#fffdf8',
      '--color-text': '#43281a',
      '--color-muted': '#977c68',
      '--color-border': '#ecdcc9',
      '--radius': '16px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'pill',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    vibe: 'Soft pastel purple — spa, wellness',
    vars: {
      '--color-primary': '#8b5cf6',
      '--color-primary-fg': '#ffffff',
      '--color-bg': '#f7f5ff',
      '--color-card': '#ffffff',
      '--color-text': '#33305a',
      '--color-muted': '#837fa8',
      '--color-border': '#e6e2f7',
      '--radius': '18px',
      '--font-heading': SANS,
      '--font-body': SANS,
      '--btn-style': 'pill',
    },
  },
  {
    id: 'wine',
    name: 'Wine',
    vibe: 'Deep burgundy + cream, refined — florist, upscale',
    vars: {
      '--color-primary': '#7d1935',
      '--color-primary-fg': '#fdf2f5',
      '--color-bg': '#fbf4f1',
      '--color-card': '#ffffff',
      '--color-text': '#3a1420',
      '--color-muted': '#8a6570',
      '--color-border': '#ecd8d3',
      '--radius': '4px',
      '--font-heading': SERIF,
      '--font-body': SANS,
      '--btn-style': 'sharp',
    },
  },
];

export const DEFAULT_THEME_ID = 'clean';

// localStorage key holding the last-applied theme so the boot script can paint
// the correct theme before React loads (avoids the default-theme flash).
export const THEME_CACHE_KEY = 'theme_cache';

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

// Apply a theme by writing its CSS variables onto <html>, and cache it so the
// next page load can apply it instantly (before first paint) via the boot
// script in the root layout. Called on load and when the owner picks a theme.
export function applyTheme(id: string | null | undefined): void {
  if (typeof document === 'undefined') return;
  const theme = getTheme(id);
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.id);
  for (const [k, v] of Object.entries(theme.vars)) {
    root.style.setProperty(k, v);
  }
  try {
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({ id: theme.id, vars: theme.vars }));
  } catch {
    /* ignore */
  }
}

// Inline script (runs in <head> before paint) that applies the cached theme so
// returning visitors never see the default theme flash. Kept dependency-free.
export const THEME_BOOT_SCRIPT = `
(function(){
  try {
    var c = JSON.parse(localStorage.getItem('${THEME_CACHE_KEY}'));
    if (c && c.vars) {
      var r = document.documentElement;
      r.setAttribute('data-theme', c.id);
      for (var k in c.vars) r.style.setProperty(k, c.vars[k]);
    }
  } catch (e) {}
})();
`;
