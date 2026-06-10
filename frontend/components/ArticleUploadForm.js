'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import LanguageConfirmModal, { UnsupportedLanguageModal } from './LanguageConfirmModal';
import {
  detectDocumentLanguage,
  guestDetectDocumentLanguage,
  guestUploadArticle,
  uploadArticle,
} from '../lib/api';
import { isAuthenticated } from '../lib/auth';
import { DOCX_MIME, IMAGE_MIMES } from '../lib/constants';
import { getOrCreateGuestToken } from '../lib/guest-article';
import { formatUserError } from '../lib/i18n';
import { useLanguage } from '../providers/LanguageProvider';

function validateDocx(file) {
  if (!file) return 'upload.errorSelectDocx';
  const isDocx =
    file.name.toLowerCase().endsWith('.docx') ||
    file.type === DOCX_MIME ||
    file.type === 'application/octet-stream';
  if (!isDocx) return 'upload.errorDocx';
  return null;
}

function validateImage(file) {
  const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
  const lower = file.name.toLowerCase();
  const validExt = allowedExt.some((ext) => lower.endsWith(ext));
  const validMime = !file.type || IMAGE_MIMES.includes(file.type);
  if (!validExt || !validMime) return 'upload.errorImage';
  return null;
}

export default function ArticleUploadForm({ inputIdPrefix = '', onSuccess }) {
  const router = useRouter();
  const { t } = useLanguage();
  const docInputId = `${inputIdPrefix}docx-input`;
  const imagesInputId = `${inputIdPrefix}images-input`;

  const [documentFile, setDocumentFile] = useState(null);
  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unsupportedOpen, setUnsupportedOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');

  const assignDocument = useCallback(
    (file) => {
      const validationError = validateDocx(file);
      if (validationError) {
        setError(t(validationError));
        return;
      }
      setError('');
      setDocumentFile(file);
    },
    [t]
  );

  const assignImages = useCallback(
    (fileList) => {
      const incoming = Array.from(fileList || []);
      const next = [];
      for (const file of incoming) {
        const validationError = validateImage(file);
        if (validationError) {
          setError(t(validationError, { name: file.name }));
          return;
        }
        next.push(file);
      }
      setError('');
      setImages((prev) => [...prev, ...next].slice(0, 10));
    },
    [t]
  );

  function onDrop(event) {
    event.preventDefault();
    setDragActive(false);
    const doc = Array.from(event.dataTransfer.files || []).find((f) =>
      f.name.toLowerCase().endsWith('.docx')
    );
    const imgs = Array.from(event.dataTransfer.files || []).filter(
      (f) => IMAGE_MIMES.includes(f.type) || /\.(jpg|jpeg|png|webp)$/i.test(f.name)
    );
    if (doc) assignDocument(doc);
    if (imgs.length) assignImages(imgs);
  }

  async function performUpload(sourceLang) {
    setLoading(true);
    setError('');

    try {
      const authenticated = isAuthenticated();
      let result;

      if (authenticated) {
        result = await uploadArticle(documentFile, images, sourceLang);
      } else {
        const guestToken = getOrCreateGuestToken();
        result = await guestUploadArticle(documentFile, images, sourceLang, guestToken);
        result = { ...result, guest_token: result.guest_token || guestToken };
      }

      if (onSuccess) {
        onSuccess(result.id, { guestToken: result.guest_token });
      } else if (result.guest_token) {
        router.push(
          `/processing/${result.id}?guest_token=${encodeURIComponent(result.guest_token)}`
        );
      } else {
        router.push(`/processing/${result.id}`);
      }
    } catch (err) {
      if (err.status === 401 && isAuthenticated()) {
        router.push('/login');
        return;
      }
      setError(formatUserError(err, t, 'upload.errorFailed'));
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateDocx(documentFile);
    if (validationError) {
      setError(t(validationError));
      return;
    }

    setDetecting(true);
    setError('');

    try {
      const authenticated = isAuthenticated();
      const detectResult = authenticated
        ? await detectDocumentLanguage(documentFile)
        : await guestDetectDocumentLanguage(documentFile, getOrCreateGuestToken());

      if (!detectResult.is_supported || detectResult.detected_lang === 'unknown') {
        setUnsupportedOpen(true);
        return;
      }

      const detected = detectResult.detected_lang;
      if (detected === 'en') {
        await performUpload('en');
        return;
      }

      setSelectedLang(detected);
      setConfirmOpen(true);
    } catch (err) {
      if (err.status === 401 && isAuthenticated()) {
        router.push('/login');
        return;
      }
      setError(formatUserError(err, t, 'upload.errorFailed'));
    } finally {
      setDetecting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="upload-form">
        <div
          className={`dropzone ${dragActive ? 'active' : ''} ${documentFile ? 'has-file' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById(docInputId)?.click()}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>{t('upload.dropzoneTitle')}</p>
          <p style={{ color: 'var(--muted)' }}>{t('upload.dropzoneHint')}</p>
          <input
            id={docInputId}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            hidden
            onChange={(e) => assignDocument(e.target.files?.[0])}
          />
        </div>

        {documentFile ? (
          <div className="file-list">
            <div className="file-chip">
              <span>{documentFile.name}</span>
              <button type="button" onClick={() => setDocumentFile(null)}>
                {t('upload.remove')}
              </button>
            </div>
          </div>
        ) : null}

        <div className="upload-photos-block">
          <div className="upload-photos-header">
            <div>
              <p className="field-label upload-photos-label">{t('upload.imagesLabel')}</p>
              <p className="upload-photos-hint">{t('upload.imagesHint')}</p>
            </div>
            <label htmlFor={imagesInputId} className="upload-photos-btn">
              <span className="upload-photos-btn-icon" aria-hidden>
                +
              </span>
              {t('upload.imagesAdd')}
            </label>
            <input
              id={imagesInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => assignImages(e.target.files)}
            />
          </div>
          {images.length ? (
            <div className="upload-photos-grid">
              {images.map((image, index) => (
                <div key={`${image.name}-${index}`} className="upload-photo-chip">
                  <span className="upload-photo-name">{image.name}</span>
                  <button
                    type="button"
                    className="upload-photo-remove"
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                    aria-label={t('upload.remove')}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="upload-form-actions">
          <button
            className="btn btn-gradient upload-submit-btn"
            type="submit"
            disabled={loading || detecting || !documentFile}
          >
            {detecting
              ? t('upload.detecting')
              : loading
                ? t('upload.submitting')
                : t('upload.submit')}
          </button>
        </div>
      </form>

      <LanguageConfirmModal
        open={confirmOpen}
        detectedLang={selectedLang}
        selectedLang={selectedLang}
        onSelectLang={setSelectedLang}
        onConfirm={() => performUpload(selectedLang)}
        onCancel={() => setConfirmOpen(false)}
      />

      <UnsupportedLanguageModal open={unsupportedOpen} onClose={() => setUnsupportedOpen(false)} />
    </>
  );
}
