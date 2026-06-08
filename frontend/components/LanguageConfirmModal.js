'use client';

import {
  CONTENT_LANGUAGE_CODES,
  getLanguageLabel,
  UI_LOCALE_FLAGS,
} from '../lib/i18n';
import { useLanguage } from '../providers/LanguageProvider';

export default function LanguageConfirmModal({
  open,
  detectedLang,
  selectedLang,
  onSelectLang,
  onConfirm,
  onCancel,
}) {
  const { t } = useLanguage();

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h2>{t('upload.confirmLanguageTitle')}</h2>
        <p>{t('upload.confirmLanguageBody', { language: getLanguageLabel(selectedLang, t) })}</p>

        <div className="language-picker-grid">
          {CONTENT_LANGUAGE_CODES.map((code) => (
            <button
              key={code}
              type="button"
              className={`language-picker-option ${selectedLang === code ? 'active' : ''}`}
              onClick={() => onSelectLang(code)}
            >
              <span>{UI_LOCALE_FLAGS[code]}</span>
              <span>{getLanguageLabel(code, t)}</span>
            </button>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {t('upload.confirmLanguageCancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            {t('upload.confirmLanguageConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UnsupportedLanguageModal({ open, onClose }) {
  const { t } = useLanguage();

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h2>{t('upload.unsupportedLanguageTitle')}</h2>
        <p>{t('upload.unsupportedLanguageBody')}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
