'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchArticle, updateArticle } from '../../lib/api';
import { buildImageLookup } from '../../lib/images';
import { formatUserError } from '../../lib/i18n';
import { useLanguage } from '../../providers/LanguageProvider';
import RawContentPanel from './RawContentPanel';
import MagazinePreview from './MagazinePreview';
import ExtractedForm from './ExtractedForm';
import SourceDrawer from './SourceDrawer';

export default function ArticleEditor({ articleId }) {
  const { t } = useLanguage();
  const tabs = useMemo(
    () => [
      { id: 'source', label: t('editor.tabRaw') },
      { id: 'magazine', label: t('editor.tabMagazine') },
      { id: 'edit', label: t('editor.tabEdit') },
    ],
    [t]
  );

  const [article, setArticle] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [activeTab, setActiveTab] = useState('magazine');
  const [highlightedIndexes, setHighlightedIndexes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchArticle(articleId);
        if (cancelled) return;
        setArticle(data);
        setExtractedData(data.extracted_data_json || {});
      } catch (err) {
        if (!cancelled) setError(formatUserError(err, t, 'editor.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [articleId, t]);

  const chunks = useMemo(() => article?.raw_content_json || [], [article]);
  const imageLookup = useMemo(() => buildImageLookup(article?.images || []), [article?.images]);

  function handleHighlight(sources = []) {
    setHighlightedIndexes(new Set(sources));
  }

  function handleClearHighlight() {
    setHighlightedIndexes(new Set());
  }

  function jumpToSources() {
    if (highlightedIndexes.size) {
      setActiveTab('source');
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const result = await updateArticle(articleId, {
        title: extractedData.title,
        extracted_data_json: extractedData,
      });
      setArticle((prev) => ({ ...prev, ...result }));
      setExtractedData(result.extracted_data_json || extractedData);
      setSaveMessage(t('editor.saved'));
    } catch (err) {
      setSaveError(formatUserError(err, t, 'editor.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="skeleton" style={{ height: 24, width: '50%' }} />
        <div className="skeleton" style={{ height: 16, width: '80%', marginTop: 12 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ marginTop: '2rem' }}>
        <p className="error-text">{error}</p>
        <Link href="/dashboard" className="btn btn-secondary">
          {t('editor.backDashboard')}
        </Link>
      </div>
    );
  }

  const showSourceDrawer = activeTab !== 'source' && highlightedIndexes.size > 0;

  return (
    <div className="editor-layout">
      <section className="hero editor-hero">
        <h1>{article.title}</h1>
        <p>{t('editor.heroHint')}</p>
      </section>

      <div className="editor-shell">
        <div className="editor-main-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'source') {
                  handleClearHighlight();
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="editor-tab-panel">
          {activeTab === 'source' ? (
            <>
              <p className="editor-tab-hint">{t('editor.sourceTabHint')}</p>
              <RawContentPanel embedded chunks={chunks} highlightedIndexes={highlightedIndexes} />
            </>
          ) : null}

          {activeTab === 'magazine' ? (
            <>
              <p className="editor-tab-hint">{t('editor.magazineTabHint')}</p>
              <MagazinePreview
                data={extractedData}
                images={article?.images || []}
                imageLookup={imageLookup}
                onHighlight={handleHighlight}
                onClearHighlight={handleClearHighlight}
              />
            </>
          ) : null}

          {activeTab === 'edit' ? (
            <ExtractedForm
              embedded
              data={extractedData}
              onChange={setExtractedData}
              onHighlight={handleHighlight}
              onClearHighlight={handleClearHighlight}
              onSave={handleSave}
              saving={saving}
              saveMessage={saveMessage}
              saveError={saveError}
            />
          ) : null}
        </div>

        {showSourceDrawer ? (
          <div className="source-drawer-wrap">
            <SourceDrawer chunks={chunks} highlightedIndexes={highlightedIndexes} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={jumpToSources}>
              {t('editor.viewSource')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
