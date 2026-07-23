// Shared-link preview card, generated in the browser so it always matches the
// store's CURRENT theme + tagline.
//
// A static site can't render a per-store preview at request time (social
// scrapers don't run JS), so instead the admin app draws a 1200×630 card on a
// canvas whenever the theme/tagline changes and uploads it to Supabase Storage
// at a STABLE path. The og:image meta tag (baked at build) points at that path,
// so overwriting the file updates the preview everywhere without a rebuild.

import { getSupabase } from './supabase';
import { getSettings } from './store';
import { getTheme, DEFAULT_THEME_ID } from './themes';
import type { Settings } from './types';

const OG_BUCKET = 'store-images';
export const OG_CARD_PATH = 'og/card.png';

// Deterministic public URL for the card (used at build time for the og:image).
export function ogCardUrl(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${OG_BUCKET}/${OG_CARD_PATH}`;
}

// Split a tagline into display lines: at commas (keeping the comma), otherwise
// balance the words across two lines.
function splitToLines(text: string): string[] {
  if (text.includes(',')) {
    const parts = text.split(',').map((s) => s.trim()).filter(Boolean);
    return parts.map((p, i) => (i < parts.length - 1 ? `${p},` : p));
  }
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 4) return [text];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

async function drawCard(settings: Settings): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const v = getTheme(settings.theme || DEFAULT_THEME_ID).vars;
  const bg = v['--color-bg'];
  const primary = v['--color-primary'];
  const text = v['--color-text'];

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background + thin theme accent stripes top & bottom.
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, 1200, 14);
  ctx.fillRect(0, 616, 1200, 14);

  // Just the tagline — split into lines, rendered in a unique two-tone style.
  const raw = (settings.tagline || settings.store_name || 'OPEN STORE').trim();
  const lines = splitToLines(raw);

  const maxWidth = 980;
  const fontOf = (px: number) => `800 ${px}px system-ui, 'Segoe UI', Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Auto-fit so the widest line stays within the card.
  let fs = 96;
  while (fs > 44) {
    ctx.font = fontOf(fs);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= maxWidth) break;
    fs -= 4;
  }
  ctx.font = fontOf(fs);

  const lineH = Math.round(fs * 1.16);
  const blockH = lineH * lines.length;
  const firstBaseline = Math.round((630 - blockH) / 2 + fs * 0.8);

  // Eyebrow accent bar above the text.
  const barW = 96;
  const barH = 8;
  ctx.fillStyle = primary;
  ctx.fillRect((1200 - barW) / 2, firstBaseline - Math.round(fs * 0.8) - 46, barW, barH);

  // Lines: last line in the theme's primary color for a stylish two-tone look.
  lines.forEach((line, i) => {
    ctx.font = fontOf(fs);
    ctx.fillStyle = i === lines.length - 1 ? primary : text;
    ctx.fillText(line, 600, firstBaseline + i * lineH, maxWidth + 40);
  });

  return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

// Regenerate the preview card from the current (or given) settings and upload it
// to the stable path. Best-effort and non-fatal — the store works without it.
// Requires the admin to be logged in (Storage writes are admin-only under RLS).
export async function refreshOgCard(settings?: Settings): Promise<void> {
  try {
    const supabase = await getSupabase();
    if (!supabase) return;
    const s = settings ?? (await getSettings());
    const blob = await drawCard(s);
    if (!blob) return;
    await supabase.storage.from(OG_BUCKET).upload(OG_CARD_PATH, blob, {
      contentType: 'image/png',
      upsert: true,
      cacheControl: '60',
    });
  } catch {
    /* non-fatal */
  }
}

// Refresh the card at most once per page load — called when the admin opens the
// panel, so the preview always reflects the current theme and tagline pulled
// from storage, without the owner having to change anything.
let didAutoRefresh = false;
export async function autoRefreshOgCardOnce(): Promise<void> {
  if (didAutoRefresh) return;
  didAutoRefresh = true;
  await refreshOgCard();
}
