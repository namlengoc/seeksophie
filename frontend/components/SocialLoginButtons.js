'use client';

import { useState } from 'react';
import { API_URL } from '../lib/constants';
import {
  getOrCreateGuestToken,
  markArticleResumeAfterAuth,
  primeAuthResumeFromSearch,
  readArticleIdFromSearch,
} from '../lib/guest-article';
import { useLanguage } from '../providers/LanguageProvider';

export default function SocialLoginButtons({ articleId = null } = {}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  function primeGuestArticleResume() {
    if (typeof window === 'undefined') return;

    primeAuthResumeFromSearch(window.location.search);

    const articleIdFromUrl = readArticleIdFromSearch(window.location.search);
    const resolvedArticleId = articleId ?? articleIdFromUrl;

    if (resolvedArticleId !== null) {
      markArticleResumeAfterAuth(resolvedArticleId);
    }
  }

  function startGoogleOAuth() {
    primeGuestArticleResume();
    setLoading(true);

    const articleIdFromUrl = readArticleIdFromSearch(window.location.search);
    const resolvedArticleId = articleId ?? articleIdFromUrl;
    const params = new URLSearchParams();

    if (resolvedArticleId !== null) {
      params.set('article_id', String(resolvedArticleId));
      params.set('next', `/editor/${resolvedArticleId}`);
    }

    const guestToken = getOrCreateGuestToken();
    if (guestToken) {
      params.set('guest_token', guestToken);
    }

    const query = params.toString();
    window.location.assign(
      `${API_URL}/api/v1/auth/social/google/redirect${query ? `?${query}` : ''}`
    );
  }

  return (
    <div className="auth-social-grid">
      <button
        type="button"
        className="auth-social-btn"
        aria-label={t('auth.social.continueWithGoogle')}
        onClick={startGoogleOAuth}
        disabled={loading}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
          alt=""
          aria-hidden
          className="auth-social-icon"
          loading="lazy"
        />
        <span className="auth-social-label">
          {loading ? t('auth.social.redirecting') : t('auth.social.google')}
        </span>
      </button>
    </div>
  );
}
