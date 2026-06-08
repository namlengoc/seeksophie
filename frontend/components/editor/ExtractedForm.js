'use client';

import { useLanguage } from '../../providers/LanguageProvider';

function listToTextarea(value) {
  return Array.isArray(value) ? value.join('\n') : '';
}

function textareaToList(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function SourceField({
  label,
  value,
  onChange,
  sources = [],
  onHighlight,
  onClearHighlight,
  rows = 4,
  meta,
  t,
}) {
  return (
    <div className="form-section">
      <label className="field-label">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onMouseEnter={() => onHighlight(sources)}
        onMouseLeave={onClearHighlight}
        onFocus={() => onHighlight(sources)}
        onBlur={onClearHighlight}
      />
      {meta ? <div className="field-meta">{meta}</div> : null}
      {sources?.length ? (
        <div className="field-meta">
          {t('editor.form.sources', { sources: sources.join(', ') })}
        </div>
      ) : null}
    </div>
  );
}

export default function ExtractedForm({
  data,
  onChange,
  onHighlight,
  onClearHighlight,
  onSave,
  saving,
  saveMessage,
  saveError,
  embedded = false,
}) {
  const { t } = useLanguage();

  if (!data) return null;

  function updateField(field, value) {
    onChange({ ...data, [field]: value });
  }

  function updateSection(index, field, value) {
    const sections = [...(data.sections || [])];
    sections[index] = { ...sections[index], [field]: value };
    onChange({ ...data, sections });
  }

  function updateFact(index, field, value) {
    const keyFacts = [...(data.key_facts || [])];
    keyFacts[index] = { ...keyFacts[index], [field]: value };
    onChange({ ...data, key_facts: keyFacts });
  }


  const formBody = (
    <>
      <SourceField
        label={t('editor.form.title')}
        value={data.title || ''}
        onChange={(value) => updateField('title', value)}
        sources={[]}
        onHighlight={onHighlight}
        onClearHighlight={onClearHighlight}
        rows={2}
        t={t}
      />

      <SourceField
        label={t('editor.form.introHook')}
        value={data.intro_hook || ''}
        onChange={(value) => updateField('intro_hook', value)}
        sources={data.intro_sources || []}
        onHighlight={onHighlight}
        onClearHighlight={onClearHighlight}
        t={t}
      />

      {(data.sections || []).map((section, index) => (
        <div
          key={index}
          className="form-section"
          style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}
        >
          <SourceField
            label={t('editor.form.sectionHeading', { index: index + 1 })}
            value={section.heading || ''}
            onChange={(value) => updateSection(index, 'heading', value)}
            sources={section.sources || []}
            onHighlight={onHighlight}
            onClearHighlight={onClearHighlight}
            rows={2}
            t={t}
          />
          <SourceField
            label={t('editor.form.sectionBody', { index: index + 1 })}
            value={section.content || ''}
            onChange={(value) => updateSection(index, 'content', value)}
            sources={section.sources || []}
            onHighlight={onHighlight}
            onClearHighlight={onClearHighlight}
            rows={6}
            meta={
              section.suggested_images?.length
                ? t('editor.form.suggestedImages', {
                    names: section.suggested_images.join(', '),
                  })
                : null
            }
            t={t}
          />
        </div>
      ))}

      <SourceField
        label={t('editor.form.bestFor')}
        value={listToTextarea(data.best_for)}
        onChange={(value) => updateField('best_for', textareaToList(value))}
        sources={data.best_for_sources || []}
        onHighlight={onHighlight}
        onClearHighlight={onClearHighlight}
        rows={3}
        meta={t('editor.form.onePerLine')}
        t={t}
      />

      <SourceField
        label={t('editor.form.notFor')}
        value={listToTextarea(data.not_for)}
        onChange={(value) => updateField('not_for', textareaToList(value))}
        sources={data.not_for_sources || []}
        onHighlight={onHighlight}
        onClearHighlight={onClearHighlight}
        rows={3}
        meta={t('editor.form.onePerLine')}
        t={t}
      />

      <SourceField
        label={t('editor.form.ethicsSafety')}
        value={data.ethics_safety || ''}
        onChange={(value) => updateField('ethics_safety', value)}
        sources={data.ethics_sources || []}
        onHighlight={onHighlight}
        onClearHighlight={onClearHighlight}
        rows={3}
        t={t}
      />

      {(data.key_facts || []).map((fact, index) => (
        <div
          key={index}
          className="form-section"
          style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}
        >
          <SourceField
            label={t('editor.form.factName', { index: index + 1 })}
            value={fact.fact_name || ''}
            onChange={(value) => updateFact(index, 'fact_name', value)}
            sources={fact.sources || []}
            onHighlight={onHighlight}
            onClearHighlight={onClearHighlight}
            rows={2}
            t={t}
          />
          <SourceField
            label={t('editor.form.factValue', { index: index + 1 })}
            value={fact.fact_value || ''}
            onChange={(value) => updateFact(index, 'fact_value', value)}
            sources={fact.sources || []}
            onHighlight={onHighlight}
            onClearHighlight={onClearHighlight}
            rows={3}
            t={t}
          />
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? t('editor.saving') : t('editor.form.saveArticle')}
        </button>
        {saveMessage ? <span className="success-text">{saveMessage}</span> : null}
        {saveError ? <span className="error-text">{saveError}</span> : null}
      </div>
    </>
  );

  if (embedded) {
    return formBody;
  }

  return (
    <div className="panel">
      <div className="panel-header">{t('editor.form.extractedPanel')}</div>
      <div className="panel-body">{formBody}</div>
    </div>
  );
}
