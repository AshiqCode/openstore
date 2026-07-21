'use client';

import { useEffect, useState } from 'react';
import { resolveConfig } from '@/lib/config';

export type Guard = 'checking' | 'ready' | 'unconfigured';

// Public store pages call this. While checking → spinner; if the store has no
// Supabase config, the page shows a friendly "not available yet" message.
//
// IMPORTANT: shoppers are NEVER redirected to the /admin key-login. Only the
// store owner visits /admin deliberately to set things up.
export function useConfigGuard(): Guard {
  const [state, setState] = useState<Guard>('checking');

  useEffect(() => {
    let active = true;
    resolveConfig().then((config) => {
      if (!active) return;
      setState(config ? 'ready' : 'unconfigured');
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
