'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '../../components/AuthLayout';
import { finalizeAuthSession } from '../../lib/auth-flow';
import { fetchMe } from '../../lib/api';
import { setAuth } from '../../lib/auth';
import {
  markArticleResumeAfterAuth,
  persistGuestTokenFromSearch,
  primeAuthResumeFromSearch,
  readArticleIdFromSearch,
} from '../../lib/guest-article';
import { useLanguage } from '../../providers/LanguageProvider';

function SocialOAuthCompleteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    const search = searchParams.toString() ? `?${searchParams.toString()}` : '';

    persistGuestTokenFromSearch(search);
    primeAuthResumeFromSearch(search);

    const articleIdFromUrl = readArticleIdFromSearch(search);
    if (articleIdFromUrl !== null) {
      markArticleResumeAfterAuth(articleIdFromUrl);
    }

    async function finalize() {
      const token = (searchParams.get('token') || '').trim();
      if (!token) {
        router.replace('/login?social_oauth_error=missing_token');
        return;
      }

      setAuth(token, { id: null, name: '', email: '', role: 'author' });

      try {
        const user = await fetchMe();
        setAuth(token, user);
        await finalizeAuthSession(router);
      } catch {
        router.replace('/login?social_oauth_error=callback_failed');
      }
    }

    void finalize();
  }, [router, searchParams]);

  return (
    <AuthLayout>
      <div className="auth-card card auth-card-center">
        <p style={{ color: 'var(--muted)', margin: 0 }}>{t('auth.social.syncing')}</p>
      </div>
    </AuthLayout>
  );
}

export default function SocialOAuthCompletePage() {
  const { t } = useLanguage();

  return (
    <Suspense
      fallback={
        <AuthLayout>
          <div className="auth-card card auth-card-center">
            <p style={{ color: 'var(--muted)', margin: 0 }}>{t('auth.social.loading')}</p>
          </div>
        </AuthLayout>
      }
    >
      <SocialOAuthCompleteInner />
    </Suspense>
  );
}
