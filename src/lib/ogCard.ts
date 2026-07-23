// Shared-link preview card, generated in the browser so it always matches the
// store's CURRENT theme + branding.
//
// A static site can't render a per-store preview at request time (social
// scrapers don't run JS), so instead the admin app draws a 1200×630 card on a
// canvas whenever the theme/branding changes and uploads it to Supabase Storage
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

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Load a (possibly cross-origin) image without tainting the canvas: we fetch the
// bytes ourselves and decode from a blob. Returns null if it can't be loaded.
async function loadBadge(url: string): Promise<CanvasImageSource | null> {
  try {
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) return null;
    const blob = await resp.blob();
    if (typeof createImageBitmap === 'function') return await createImageBitmap(blob);
    return await new Promise((resolve) => {
      const img = new Image();
      const obj = URL.createObjectURL(blob);
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = obj;
    });
  } catch {
    return null;
  }
}

async function drawCard(settings: Settings): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const v = getTheme(settings.theme || DEFAULT_THEME_ID).vars;
  const bg = v['--color-bg'];
  const primary = v['--color-primary'];
  const text = v['--color-text'];
  const muted = v['--color-muted'];
  const card = v['--color-card'];

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background + theme accent stripes.
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, 1200, 14);
  ctx.fillRect(0, 616, 1200, 14);

  // Favicon / logo badge (centered near the top).
  const badgeUrl = settings.favicon_url || settings.logo_url;
  const hasBadge = !!badgeUrl && !!(await drawBadgeIfPossible());
  async function drawBadgeIfPossible(): Promise<boolean> {
    if (!badgeUrl) return false;
    const img = await loadBadge(badgeUrl);
    if (!img) return false;
    const bs = 200;
    const bx = (1200 - bs) / 2;
    const by = 92;
    const r = 40;
    roundRectPath(ctx!, bx, by, bs, bs, r);
    ctx!.fillStyle = card;
    ctx!.fill();
    ctx!.save();
    roundRectPath(ctx!, bx, by, bs, bs, r);
    ctx!.clip();
    ctx!.drawImage(img, bx, by, bs, bs);
    ctx!.restore();
    roundRectPath(ctx!, bx, by, bs, bs, r);
    ctx!.lineWidth = 5;
    ctx!.strokeStyle = primary;
    ctx!.stroke();
    return true;
  }

  // Store name (theme text color) + tagline (theme muted color).
  ctx.textAlign = 'center';
  ctx.fillStyle = text;
  ctx.font = "700 78px system-ui, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(settings.store_name || 'OPEN STORE', 600, hasBadge ? 400 : 330, 1080);

  const tag = (settings.tagline || '').trim();
  if (tag) {
    ctx.fillStyle = muted;
    ctx.font = "italic 30px system-ui, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(tag, 600, hasBadge ? 470 : 400, 1060);
  }

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
