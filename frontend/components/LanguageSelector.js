'use client';

import { useEffect, useRef, useState } from 'react';
import { CONTENT_LANGUAGE_CODES, UI_LOCALE_FLAGS, UI_LOCALE_LABELS } from '../lib/i18n';
import { useLanguage } from '../providers/LanguageProvider';

export default function LanguageSelector({ compact = false }) {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDocClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div className={`lang-selector ${compact ? 'lang-selector-compact' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="lang-selector-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={t('header.language')}
      >
        <span>{UI_LOCALE_FLAGS[locale]}</span>
        {!compact ? <span>{UI_LOCALE_LABELS[locale]}</span> : null}
      </button>
      {open ? (
        <div className="lang-selector-menu" role="menu">
          {CONTENT_LANGUAGE_CODES.map((code) => (
            <button
              key={code}
              type="button"
              role="menuitem"
              className={code === locale ? 'active' : ''}
              onClick={() => {
                setLocale(code);
                setOpen(false);
              }}
            >
              <span>{UI_LOCALE_FLAGS[code]}</span>
              <span>{UI_LOCALE_LABELS[code]}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
