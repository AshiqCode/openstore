'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

// Copies text to the clipboard with a "Copied!" confirmation.
export function CopyButton({
  text,
  label = 'Copy',
  className = 'btn btn-primary',
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers / non-secure contexts.
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      className={`${className} inline-flex items-center gap-1.5`}
      onClick={copy}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}
