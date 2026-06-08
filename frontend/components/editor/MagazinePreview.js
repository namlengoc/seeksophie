'use client';

import { useMemo } from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import AuthImage from './AuthImage';
import ImageCarousel from './ImageCarousel';
import { resolveImageUrl } from '../../lib/images';

const MAX_INLINE_IMAGES = 3;

function HighlightBlock({ sources, onHighlight, onClearHighlight, children, className = '' }) {
  return (
    <div
      className={className}
      onMouseEnter={() => onHighlight?.(sources || [])}
      onMouseLeave={() => onClearHighlight?.()}
    >
      {children}
    </div>
  );
}

function SectionImages({ names = [], imageLookup = {} }) {
  const urls = names
    .map((name) => ({ name, url: resolveImageUrl(imageLookup, name) }))
    .filter((item) => item.url);

  if (!urls.length) return null;

  return (
    <div className="magazine-inline-photos">
      {urls.map(({ name, url }) => (
        <figure key={name} className="magazine-inline-photo-wrap">
          <AuthImage src={url} alt={name} className="magazine-inline-photo" />
        </figure>
      ))}
    </div>
  );
}

function buildInlineImagePlan(sections = []) {
  const allowed = new Set();
  const perSection = [];

  for (const section of sections) {
    const sectionNames = [];
    for (const name of section.suggested_images || []) {
      if (allowed.size >= MAX_INLINE_IMAGES) break;
      if (allowed.has(name)) continue;
      allowed.add(name);
      sectionNames.push(name);
    }
    perSection.push(sectionNames);
  }

  return perSection;
}

export default function MagazinePreview({ data, images = [], imageLookup = {}, onHighlight, onClearHighlight }) {
  const { t } = useLanguage();

  const inlinePlan = useMemo(
    () => buildInlineImagePlan(data?.sections || []),
    [data?.sections]
  );

  const inlineUsed = useMemo(() => new Set(inlinePlan.flat()), [inlinePlan]);

  const carouselImages = useMemo(() => {
    const unused = images.filter(
      (img) => !inlineUsed.has(img.filename) && !inlineUsed.has(img.stored_name)
    );
    if (unused.length > 0) return unused;
    // AI did not place images inline — still show uploaded photos
    if (inlineUsed.size === 0 && images.length > 0) return images;
    return [];
  }, [images, inlineUsed]);

  if (!data) {
    return <div className="magazine-preview empty-state">{t('editor.magazineEmpty')}</div>;
  }

  const showCarousel = carouselImages.length > 0;

  return (
    <article className="magazine-preview">
      <header className="magazine-header">
        <p className="magazine-kicker">{t('editor.magazineKicker')}</p>
        <h1 className="magazine-title">{data.title}</h1>
      </header>

      {data.intro_hook ? (
        <HighlightBlock
          sources={data.intro_sources}
          onHighlight={onHighlight}
          onClearHighlight={onClearHighlight}
          className="magazine-lede"
        >
          <p>{data.intro_hook}</p>
        </HighlightBlock>
      ) : null}

      {(data.sections || []).map((section, index) => (
        <HighlightBlock
          key={index}
          sources={section.sources}
          onHighlight={onHighlight}
          onClearHighlight={onClearHighlight}
          className="magazine-section"
        >
          <h2>{section.heading}</h2>
          {section.content.split('\n').map((paragraph, pIndex) => (
            <p key={pIndex}>{paragraph}</p>
          ))}
          <SectionImages names={inlinePlan[index] || []} imageLookup={imageLookup} />
        </HighlightBlock>
      ))}

      <div className="magazine-meta-grid">
        {data.best_for?.length ? (
          <HighlightBlock
            sources={data.best_for_sources}
            onHighlight={onHighlight}
            onClearHighlight={onClearHighlight}
            className="magazine-callout magazine-callout--best"
          >
            <h3>{t('editor.bestFor')}</h3>
            <ul>
              {data.best_for.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </HighlightBlock>
        ) : null}

        {data.not_for?.length ? (
          <HighlightBlock
            sources={data.not_for_sources}
            onHighlight={onHighlight}
            onClearHighlight={onClearHighlight}
            className="magazine-callout magazine-callout--not"
          >
            <h3>{t('editor.notFor')}</h3>
            <ul>
              {data.not_for.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </HighlightBlock>
        ) : null}
      </div>

      {data.key_facts?.length ? (
        <div className="magazine-facts">
          <h3>{t('editor.keyFacts')}</h3>
          <dl>
            {data.key_facts.map((fact, index) => (
              <HighlightBlock
                key={index}
                sources={fact.sources}
                onHighlight={onHighlight}
                onClearHighlight={onClearHighlight}
                className="magazine-fact-row"
              >
                <dt>{fact.fact_name}</dt>
                <dd>{fact.fact_value}</dd>
              </HighlightBlock>
            ))}
          </dl>
        </div>
      ) : null}

      {data.ethics_safety ? (
        <HighlightBlock
          sources={data.ethics_sources}
          onHighlight={onHighlight}
          onClearHighlight={onClearHighlight}
          className="magazine-ethics"
        >
          <h3>{t('editor.ethicsSafety')}</h3>
          <p>{data.ethics_safety}</p>
        </HighlightBlock>
      ) : null}

      {showCarousel ? (
        <ImageCarousel images={carouselImages} title={t('editor.photoGallery')} />
      ) : null}
    </article>
  );
}
