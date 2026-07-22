// Small formatting / helper utilities: currency, WhatsApp links, phone
// normalisation, and client-side image compression.

import type { OrderItem } from './types';

// "Rs. 1,200" — currency prefix comes from settings.
export function money(amount: number, currency = 'Rs.'): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${n.toLocaleString('en-PK')}`;
}

// Normalise a Pakistani number to wa.me digits (e.g. 03001234567 -> 923001234567).
export function toWaNumber(raw: string): string {
  let digits = (raw || '').replace(/[^\d]/g, '');
  if (digits.startsWith('0')) digits = '92' + digits.slice(1);
  if (!digits.startsWith('92') && digits.length === 10) digits = '92' + digits;
  return digits;
}

// Build the WhatsApp order message sent to the store owner at checkout.
export function buildOrderMessage(opts: {
  storeName: string;
  items: OrderItem[];
  deliveryCharges: number;
  total: number;
  name: string;
  phone: string;
  address: string;
  currency: string;
  orderId: string;
}): string {
  const { storeName, items, deliveryCharges, total, name, phone, address, currency, orderId } = opts;
  const lines = items.map(
    (i) => `${i.name} x ${i.qty} = ${money(i.price * i.qty, currency)}`
  );
  return [
    `*New Order — ${storeName}*`,
    ...lines,
    `Delivery: ${money(deliveryCharges, currency)}`,
    `*Total: ${money(total, currency)}*`,
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Address: ${address}`,
    `Order ID: ${orderId.slice(0, 8)}`,
  ].join('\n');
}

// Full wa.me URL with an encoded message. Empty string if no number set.
export function waLink(number: string, message: string): string {
  const wa = toWaNumber(number);
  if (!wa) return '';
  return `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
}

// Compress an image file in the browser before upload (canvas, max 1200px,
// ~80% JPEG) to protect the Supabase free tier. Returns a JPEG Blob.
export async function compressImage(
  file: File,
  maxSize = 1200,
  quality = 0.8
): Promise<Blob> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    if (width >= height) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    } else {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file; // fallback: upload original
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      'image/jpeg',
      quality
    );
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Human-friendly date for order lists.
export function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-PK', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
