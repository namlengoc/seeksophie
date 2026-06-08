'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import LanguageSelector from './LanguageSelector';
import { getUser, clearAuth } from '../lib/auth';
import { roleLabel } from '../lib/i18n';
import { useLanguage } from '../providers/LanguageProvider';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();
  const { t } = useLanguage();

  function logout() {
    clearAuth();
    router.push('/login');
  }

  const isLanding = pathname === '/';

  return (
    <header className={`site-header ${isLanding ? 'site-header-landing' : ''}`}>
      <div className="container site-header-inner">
        <Link href="/" className="brand">
          {t('app.brand')}
        </Link>
        <nav className="nav-links">
          <LanguageSelector compact={!isLanding} />
          {user ? (
            <>
              <Link href="/upload" className={pathname === '/upload' ? 'active' : ''}>
                {t('header.upload')}
              </Link>
              <Link href="/dashboard" className={pathname.startsWith('/dashboard') ? 'active' : ''}>
                {t('header.dashboard')}
              </Link>
              <span className={`badge badge-${user.role}`}>{roleLabel(t, user.role)}</span>
              <button type="button" onClick={logout}>
                {t('header.logout')}
              </button>
            </>
          ) : (
            <Link href="/login">{t('header.login')}</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
