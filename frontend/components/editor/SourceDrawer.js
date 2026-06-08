'use client';

import { useLanguage } from '../../providers/LanguageProvider';

export default function SourceDrawer({ chunks = [], highlightedIndexes = new Set() }) {
  const { t } = useLanguage();
  const highlighted = chunks.filter((chunk) => highlightedIndexes.has(chunk.index));

  if (!highlighted.length) {
    return null;
  }

  return (
    <aside className="source-drawer" aria-live="polite">
      <div className="source-drawer-header">
        <strong>{t('editor.sourceDrawerTitle')}</strong>
        <span className="source-drawer-meta">
          {highlighted.map((c) => c.index).join(', ')}
        </span>
      </div>
      <div className="source-drawer-body">
        {highlighted.map((chunk) => (
          <div key={chunk.index} className="raw-line highlighted">
            <span className="raw-index">{chunk.index}</span>
            <span>{chunk.text}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
