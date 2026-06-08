'use client';

import { useState } from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import AuthImage from './AuthImage';

export default function ImageCarousel({ images = [], title }) {
  const { t } = useLanguage();
  const displayTitle = title || t('editor.carouselDefaultTitle');
  const [index, setIndex] = useState(0);

  if (!images.length) return null;

  const current = images[index] || images[0];
  const src = current.url;
  const alt = current.filename || current.stored_name || displayTitle;

  function goPrev() {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  function goNext() {
    setIndex((prev) => (prev + 1) % images.length);
  }

  return (
    <section className="image-carousel" aria-label={displayTitle}>
      <h3 className="image-carousel-title">{displayTitle}</h3>
      <div className="image-carousel-frame">
        {images.length > 1 ? (
          <button
            type="button"
            className="image-carousel-nav image-carousel-nav--prev"
            onClick={goPrev}
            aria-label={t('editor.carouselPrev')}
          >
            ‹
          </button>
        ) : null}
        <figure className="image-carousel-slide">
          <AuthImage src={src} alt={alt} className="image-carousel-photo" />
          <figcaption>
            {t('editor.carouselCounter', { current: index + 1, total: images.length })}
          </figcaption>
        </figure>
        {images.length > 1 ? (
          <button
            type="button"
            className="image-carousel-nav image-carousel-nav--next"
            onClick={goNext}
            aria-label={t('editor.carouselNext')}
          >
            ›
          </button>
        ) : null}
      </div>
    </section>
  );
}
