'use client';

import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useLanguage } from '../providers/LanguageProvider';

export default function GuestAuthModal({ open, articleId, onClose }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('login');

  if (!open) return null;

  return (
    <div
      className="modal-backdrop guest-auth-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-auth-title"
      onClick={onClose}
    >
      <div className="modal-card guest-auth-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn guest-auth-close"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          ×
        </button>

        <div className="guest-auth-intro">
          <h2 id="guest-auth-title">{t('processing.loginRequiredTitle')}</h2>
          <p>{t('processing.loginRequiredBody')}</p>
        </div>

        <div className="guest-auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'login'}
            className={tab === 'login' ? 'active' : ''}
            onClick={() => setTab('login')}
          >
            {t('auth.login.submit')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'register'}
            className={tab === 'register' ? 'active' : ''}
            onClick={() => setTab('register')}
          >
            {t('auth.register.submit')}
          </button>
        </div>

        <div className="guest-auth-panel">
          {tab === 'login' ? (
            <LoginForm embedded articleId={articleId} />
          ) : (
            <RegisterForm embedded articleId={articleId} />
          )}
        </div>
      </div>
    </div>
  );
}
