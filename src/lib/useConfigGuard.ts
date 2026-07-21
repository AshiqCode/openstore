'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveConfig } from '@/lib/config';

type Guard = 'checking' | 'ready' | 'unconfigured';

// Public pages call this: while checking, show a spinner; if the store has no
// Supabase config yet, bounce to the /admin setup wizard.
export function useConfigGuard(): Guard {
  const router = useRouter();
  const [state, setState] = useState<Guard>('checking');

  useEffect(() => {
    let active = true;
    resolveConfig().then((config) => {
      if (!active) return;
      if (config) {
        setState('ready');
      } else {
        setState('unconfigured');
        router.replace('/admin');
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  return state;
}
