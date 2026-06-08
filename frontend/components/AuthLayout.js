'use client';

import Link from 'next/link';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../providers/LanguageProvider';

export default function AuthLayout({ children }) {
  const { t } = useLanguage();

  return (
    <div className="auth-page">
      <div className="auth-page-glow" aria-hidden />
      <div className="auth-page-toolbar">
        <LanguageSelector compact />
      </div>
      <Link href="/" className="auth-brand">
        {t('app.brand')}
      </Link>
      {children}
    </div>
  );
}
