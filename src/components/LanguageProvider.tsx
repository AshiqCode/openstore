'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_LANG,
  LANG_KEY,
  LANGUAGES,
  getStrings,
  type Lang,
  type Strings,
} from '@/lib/strings';

type LangContext = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
};

const Ctx = createContext<LangContext>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: getStrings(DEFAULT_LANG),
});

// Returns the current-language string table. Usage: const S = useT();  S.cart
export function useT(): Strings {
  return useContext(Ctx).t;
}

// Returns { lang, setLang } for the language switcher.
export function useLang(): { lang: Lang; setLang: (l: Lang) => void } {
  const { lang, setLang } = useContext(Ctx);
  return { lang, setLang };
}

function applyDir(lang: Lang) {
  if (typeof document === 'undefined') return;
  const meta = LANGUAGES.find((l) => l.code === lang);
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', meta?.dir ?? 'ltr');
}

// Provides language to the whole app. Defaults to English; the visitor's choice
// is remembered per-browser in localStorage.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // Restore saved language on mount (default English if none).
  useEffect(() => {
    let saved: Lang = DEFAULT_LANG;
    try {
      const raw = localStorage.getItem(LANG_KEY);
      if (raw === 'en' || raw === 'ur' || raw === 'roman') saved = raw;
    } catch {
      /* ignore */
    }
    setLangState(saved);
    applyDir(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    applyDir(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  return <Ctx.Provider value={{ lang, setLang, t: getStrings(lang) }}>{children}</Ctx.Provider>;
}
