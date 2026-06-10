'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SocialLoginButtons from './SocialLoginButtons';
import { login } from '../lib/api';
import { finalizeAuthSession, finalizeGuestArticleAuth } from '../lib/auth-flow';
import { setAuth } from '../lib/auth';
import {
  discardStalePendingArticleWithoutResume,
  markArticleResumeAfterAuth,
  primeAuthResumeFromSearch,
  readArticleIdFromSearch,
} from '../lib/guest-article';
import { formatUserError } from '../lib/i18n';
import { useLanguage } from '../providers/LanguageProvider';

const OAUTH_ERROR_KEYS = {
  callback_failed: 'auth.login.oauthCallbackFailed',
  invalid_profile: 'auth.login.oauthInvalidProfile',
  link_failed: 'auth.login.oauthLinkFailed',
  missing_token: 'auth.login.oauthMissingToken',
};

export default function LoginForm({ embedded = false, articleId = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const registerHref =
    searchParams.toString() !== '' ? `/register?${searchParams.toString()}` : '/register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resolvedArticleId =
    articleId ?? (typeof window !== 'undefined' ? readArticleIdFromSearch(window.location.search) : null);

  useEffect(() => {
    if (embedded) return;
    discardStalePendingArticleWithoutResume();
    primeAuthResumeFromSearch(window.location.search);
    const articleIdFromUrl = readArticleIdFromSearch(window.location.search);
    if (articleIdFromUrl !== null) {
      markArticleResumeAfterAuth(articleIdFromUrl);
    }

    const oauthError = (searchParams.get('social_oauth_error') || '').toLowerCase();
    if (oauthError) {
      const key = OAUTH_ERROR_KEYS[oauthError];
      setError(key ? t(key) : t('auth.login.socialFailed'));
    }
  }, [embedded, searchParams, t]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      setAuth(data.token, data.user);

      if (embedded && resolvedArticleId !== null) {
        await finalizeGuestArticleAuth(resolvedArticleId, router);
      } else {
        await finalizeAuthSession(router);
      }
    } catch (err) {
      setError(formatUserError(err, t, 'auth.login.failed'));
    } finally {
      setLoading(false);
    }
  }

  const form = (
    <>
      <form onSubmit={handleSubmit} className={embedded ? 'auth-form auth-form-embedded' : 'auth-form'}>
        <div>
          <label className="field-label" htmlFor={embedded ? 'embedded-email' : 'email'}>
            {t('auth.common.emailLabel')}
          </label>
          <input
            id={embedded ? 'embedded-email' : 'email'}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor={embedded ? 'embedded-password' : 'password'}>
            {t('auth.login.passwordLabel')}
          </label>
          <input
            id={embedded ? 'embedded-password' : 'password'}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <button
          className={`btn auth-submit ${embedded ? 'btn-gradient' : 'btn-primary'}`}
          type="submit"
          disabled={loading}
        >
          {loading ? t('common.loading') : t('auth.login.submit')}
        </button>
      </form>

      <div className="auth-divider">
        <span>{t('auth.login.divider')}</span>
      </div>

      <SocialLoginButtons articleId={resolvedArticleId} />
    </>
  );

  if (embedded) {
    return form;
  }

  return (
    <div className="auth-card card">
      <div className="auth-card-header">
        <h1>{t('auth.login.title')}</h1>
      </div>
      {form}
      <p className="auth-switch">
        {t('auth.login.noAccount')}{' '}
        <Link href={registerHref}>{t('auth.login.register')}</Link>
      </p>
    </div>
  );
}
