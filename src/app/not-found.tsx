'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-[color:var(--color-primary-fg)] shadow-lg">
        <Compass size={30} />
      </div>

      <div
        className="text-7xl font-black leading-none tracking-tight sm:text-8xl"
        style={{ color: 'color-mix(in srgb, var(--color-primary) 30%, var(--color-border))' }}
      >
        404
      </div>

      <h1 className="mt-3 text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Link href="/" className="btn btn-primary">
          <Home size={16} /> Back to store
        </Link>
        <button className="btn btn-outline" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Go back
        </button>
      </div>
    </div>
  );
}
