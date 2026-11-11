'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LANG_COOKIE, dirOf, type Copy, type Lang } from '@/lib/i18n/config';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue>({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback(
    (next: Lang) => {
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      document.documentElement.dir = dirOf(next);
      setLangState(next);
      router.refresh();
    },
    [router],
  );

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function useCopy<T>(copy: Copy<T>): T {
  return copy[useContext(LangContext).lang];
}
