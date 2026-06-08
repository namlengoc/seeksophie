'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createTranslator,
  dictionaries,
  isSupportedUiLocale,
} from '../lib/i18n';
import {
  DEFAULT_UI_LOCALE,
  resolveBrowserOrStoredLocale,
  UI_LOCALE_STORAGE_KEY,
  writeUiLocaleCookie,
} from '../lib/i18n/ui-locale';

const LanguageContext = createContext(null);

export function LanguageProvider({ children, initialLocale = DEFAULT_UI_LOCALE }) {
  const [locale, setLocaleState] = useState(initialLocale);

  useEffect(() => {
    const resolved = resolveBrowserOrStoredLocale();
    if (isSupportedUiLocale(resolved)) {
      setLocaleState(resolved);
      writeUiLocaleCookie(resolved);
    }
  }, []);

  const setLocale = useCallback((next) => {
    if (!isSupportedUiLocale(next)) return;
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(UI_LOCALE_STORAGE_KEY, next);
      writeUiLocaleCookie(next);
    }
  }, []);

  const value = useMemo(() => {
    const t = createTranslator(locale);
    return { locale, setLocale, t, dict: dictionaries[locale] || dictionaries.en };
  }, [locale, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
