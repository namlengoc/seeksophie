'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import GuestAuthModal from './GuestAuthModal';
import { fetchArticleStatus, fetchGuestArticleStatus } from '../lib/api';
import { isAuthenticated } from '../lib/auth';
import {
  POLL_INTERVAL_MS,
  PROCESSING_STATUSES,
  TERMINAL_STATUSES,
} from '../lib/constants';
import {
  getOrCreateGuestToken,
  markArticleResumeAfterAuth,
  readGuestTokenFromSearch,
} from '../lib/guest-article';
import { formatUserError, statusLabel } from '../lib/i18n';
import { useLanguage } from '../providers/LanguageProvider';

const STATUS_MESSAGE_KEYS = [
  'processing.statusMessage.1',
  'processing.statusMessage.2',
  'processing.statusMessage.3',
  'processing.statusMessage.4',
  'processing.statusMessage.5',
  'processing.statusMessage.6',
  'processing.statusMessage.7',
  'processing.statusMessage.8',
];

export default function ProcessingView({ articleId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [status, setStatus] = useState('pending');
  const [title, setTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pollError, setPollError] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);
  const pollCountRef = useRef(0);

  const guestTokenFromUrl = readGuestTokenFromSearch(searchParams.toString());
  const isGuest = !isAuthenticated() && Boolean(guestTokenFromUrl || getOrCreateGuestToken());

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        let data;
        if (isGuest) {
          const token = guestTokenFromUrl || getOrCreateGuestToken();
          data = await fetchGuestArticleStatus(token, articleId);
        } else {
          data = await fetchArticleStatus(articleId);
        }

        if (cancelled) return;

        setStatus(data.status);
        setTitle(data.title || '');
        setErrorMessage(data.error_message || '');
        setPollError('');

        if (PROCESSING_STATUSES.includes(data.status)) {
          if (pollCountRef.current > 0) {
            setStatusMessageIndex((prev) => (prev + 1) % STATUS_MESSAGE_KEYS.length);
          }
          pollCountRef.current += 1;
        }

        if (data.status === 'draft') {
          if (isGuest || data.requires_auth) {
            markArticleResumeAfterAuth(articleId);
            setAuthModalOpen(true);
            return;
          }
          router.replace(`/editor/${articleId}`);
        }
      } catch (err) {
        if (!cancelled) setPollError(formatUserError(err, t, 'processing.statusError'));
      }
    }

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [articleId, guestTokenFromUrl, isGuest, router, t]);

  const isProcessing = PROCESSING_STATUSES.includes(status);
  const isFailed = status === 'failed';
  const isRejected = status === 'rejected';

  return (
    <>
      <div className="card processing-card" style={{ marginTop: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', margin: '0 0 0.5rem' }}>
            {title || t('processing.documentTitle')}
          </h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            {t('processing.articleLabel', { id: articleId })} ·{' '}
            <span className={`badge badge-${status}`}>{statusLabel(t, status)}</span>
          </p>
        </div>

        <div className="progress-steps">
          <div className={`progress-step ${status !== 'pending' ? 'done' : 'active'}`}>
            <span className="progress-dot" />
            {t('processing.stepUpload')}
          </div>
          <div
            className={`progress-step ${status === 'processing' ? 'active' : status !== 'pending' ? 'done' : ''}`}
          >
            <span className="progress-dot" />
            {t('processing.stepQueue')}
          </div>
          <div className={`progress-step ${status === 'draft' ? 'done' : ''}`}>
            <span className="progress-dot" />
            {t('processing.stepReady')}
          </div>
        </div>

        {isProcessing ? (
          <div>
            <div className="skeleton" style={{ height: 18, width: '85%' }} />
            <div className="skeleton" style={{ height: 18, width: '70%', marginTop: 10 }} />
            <div className="skeleton" style={{ height: 18, width: '92%', marginTop: 10 }} />
            <p className="processing-status-copy" key={statusMessageIndex}>
              {t(STATUS_MESSAGE_KEYS[statusMessageIndex])}
            </p>
          </div>
        ) : null}

        {status === 'draft' && authModalOpen ? (
          <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>{t('processing.awaitingAuth')}</p>
        ) : null}

        {isRejected ? (
          <div>
            <p className="error-text">{errorMessage || t('processing.rejected')}</p>
            <p style={{ color: 'var(--muted)', marginTop: '0.75rem' }}>{t('processing.rejectedHint')}</p>
            <Link href="/" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
              {t('processing.tryAgain')}
            </Link>
          </div>
        ) : null}

        {isFailed ? (
          <div>
            <p className="error-text">
              {errorMessage ? formatUserError({ message: errorMessage }, t, 'processing.failed') : t('processing.failed')}
            </p>
            <Link href="/" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
              {t('processing.tryAgain')}
            </Link>
          </div>
        ) : null}

        {pollError ? <p className="error-text">{pollError}</p> : null}

        {TERMINAL_STATUSES.includes(status) && status !== 'failed' && status !== 'rejected' && status !== 'draft' ? (
          <Link href={`/editor/${articleId}`} className="btn btn-primary">
            {t('processing.openEditor')}
          </Link>
        ) : null}

        {isAuthenticated() ? (
          <Link href="/dashboard" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            {t('processing.backDashboard')}
          </Link>
        ) : null}
      </div>

      <GuestAuthModal
        open={authModalOpen}
        articleId={articleId}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
