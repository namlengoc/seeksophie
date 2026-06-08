'use client';

import { useLanguage } from '../../providers/LanguageProvider';

export default function RawContentPanel({ chunks = [], highlightedIndexes = new Set(), embedded = false }) {
  const { t } = useLanguage();

  const body = !chunks.length ? (
    <div className="empty-state">{t('editor.emptyRaw')}</div>
  ) : (
    chunks.map((chunk) => (
      <div
        key={chunk.index}
        className={`raw-line ${highlightedIndexes.has(chunk.index) ? 'highlighted' : ''}`}
      >
        <span className="raw-index">{chunk.index}</span>
        <span>{chunk.text}</span>
      </div>
    ))
  );

  if (embedded) {
    return <div className="raw-content-list">{body}</div>;
  }

  return (
    <div className="panel">
      <div className="panel-header">{t('editor.rawPanelTitle')}</div>
      <div className="panel-body">{body}</div>
    </div>
  );
}
