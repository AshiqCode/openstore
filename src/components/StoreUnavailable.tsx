'use client';

import Link from 'next/link';
import { Store, Settings } from 'lucide-react';

// Shown on public store pages when the store has no Supabase config yet.
// Shoppers see a calm "coming soon" message — never the admin key-login.
// A small, low-key link lets the actual owner reach the setup at /admin.
export function StoreUnavailable() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-[color:var(--color-primary-fg)] shadow-lg">
        <Store size={30} />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Store coming soon</h1>
      <p className="mt-2 max-w-sm text-muted">
        This shop is being set up and isn&apos;t open for orders yet. Please check back a little later.
      </p>
      <Link
        href="/admin"
        className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary"
      >
        <Settings size={14} /> Store owner? Set up your store
      </Link>
    </div>
  );
}
