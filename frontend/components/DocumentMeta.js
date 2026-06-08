'use client';

import { useEffect } from 'react';
import { useLanguage } from '../providers/LanguageProvider';

export default function DocumentMeta() {
  const { locale, t } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t('app.pageTitle');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', t('app.description'));
    }
  }, [locale, t]);

  return null;
}
