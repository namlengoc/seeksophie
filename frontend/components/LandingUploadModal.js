'use client';

import { useRouter } from 'next/navigation';
import ArticleUploadForm from './ArticleUploadForm';
import { useLanguage } from '../providers/LanguageProvider';

export default function LandingUploadModal({ open, onClose }) {
  const router = useRouter();
  const { t } = useLanguage();

  if (!open) return null;

  function handleSuccess(articleId, { guestToken } = {}) {
    onClose();
    if (guestToken) {
      router.push(`/processing/${articleId}?guest_token=${encodeURIComponent(guestToken)}`);
      return;
    }
    router.push(`/processing/${articleId}`);
  }

  return (
    <div
      className="modal-backdrop landing-upload-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="landing-upload-title"
      onClick={onClose}
    >
      <div className="modal-card modal-card-wide landing-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="landing-upload-modal-header">
          <div>
            <h2 id="landing-upload-title">{t('landing.uploadModalTitle')}</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </div>
        <ArticleUploadForm inputIdPrefix="landing-" onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
