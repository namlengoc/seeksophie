'use client';

import ArticleUploadForm from './ArticleUploadForm';
import { useLanguage } from '../providers/LanguageProvider';

export default function UploadPage() {
  const { t } = useLanguage();

  return (
    <div>
      <section className="hero">
        <h1>{t('upload.title')}</h1>
        <p>{t('upload.subtitle')}</p>
      </section>

      <div className="card">
        <ArticleUploadForm inputIdPrefix="page-" />
      </div>
    </div>
  );
}
