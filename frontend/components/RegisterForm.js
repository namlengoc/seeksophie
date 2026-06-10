'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SocialLoginButtons from './SocialLoginButtons';
import { register } from '../lib/api';
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

export default function RegisterForm({ embedded = false, articleId = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const loginHref =
    searchParams.toString() !== '' ? `/login?${searchParams.toString()}` : '/login';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
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
  }, [embedded]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError(t('auth.register.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const data = await register(name, email, password);
      setAuth(data.token, data.user);

      if (embedded && resolvedArticleId !== null) {
        await finalizeGuestArticleAuth(resolvedArticleId, router);
      } else {
        await finalizeAuthSession(router);
      }
    } catch (err) {
      setError(formatUserError(err, t, 'auth.register.failed'));
    } finally {
      setLoading(false);
    }
  }

  const form = (
    <>
      <form onSubmit={handleSubmit} className={embedded ? 'auth-form auth-form-embedded' : 'auth-form'}>
        <div>
          <label className="field-label" htmlFor={embedded ? 'embedded-name' : 'name'}>
            {t('auth.register.nameLabel')}
          </label>
          <input
            id={embedded ? 'embedded-name' : 'name'}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor={embedded ? 'embedded-reg-email' : 'email'}>
            {t('auth.common.emailLabel')}
          </label>
          <input
            id={embedded ? 'embedded-reg-email' : 'email'}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor={embedded ? 'embedded-reg-password' : 'password'}>
            {t('auth.register.passwordLabel')}
          </label>
          <input
            id={embedded ? 'embedded-reg-password' : 'password'}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div>
          <label
            className="field-label"
            htmlFor={embedded ? 'embedded-password-confirm' : 'passwordConfirmation'}
          >
            {t('auth.register.passwordConfirmLabel')}
          </label>
          <input
            id={embedded ? 'embedded-password-confirm' : 'passwordConfirmation'}
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <button
          className={`btn auth-submit ${embedded ? 'btn-gradient' : 'btn-primary'}`}
          type="submit"
          disabled={loading}
        >
          {loading ? t('common.loading') : t('auth.register.submit')}
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
        <h1>{t('auth.register.title')}</h1>
      </div>
      {form}
      <p className="auth-switch">
        {t('auth.register.hasAccount')}{' '}
        <Link href={loginHref}>{t('auth.register.login')}</Link>
      </p>
    </div>
  );
}
