import type { Config } from 'tailwindcss';

// Themes are driven by CSS variables set on <html data-theme="...">.
// Tailwind color utilities below read those variables so switching a theme
// re-skins the whole app with no rebuild. See src/lib/themes.ts.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-fg': 'var(--color-primary-fg)',
        bg: 'var(--color-bg)',
        card: 'var(--color-card)',
        ink: 'var(--color-text)',
        muted: 'var(--color-muted)',
        line: 'var(--color-border)',
      },
      borderRadius: {
        theme: 'var(--radius)',
      },
      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
      },
    },
  },
  plugins: [],
};

export default config;
