'use client';

import { useEffect } from 'react';
import { S, type Strings } from '@/lib/strings';

// The app is English-only. `useT()` returns the string table; kept as a hook so
// existing `const S = useT()` calls don't need to change.
export function useT(): Strings {
  return S;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
  }, []);
  return <>{children}</>;
}
