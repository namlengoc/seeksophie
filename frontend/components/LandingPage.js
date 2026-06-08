'use client';

import { useEffect, useState } from 'react';
import LanguageSelector from './LanguageSelector';
import LandingUploadModal from './LandingUploadModal';
import { HERO_SLIDE_INTERVAL_MS, LANDING_HERO_IMAGES } from '../lib/landing-hero-images';
import { LANDING_LANG_STRIP, getLanguageLabel } from '../lib/i18n';
import { useLanguage } from '../providers/LanguageProvider';

const PREVIEW_STATS = {
  articles: 24,
  drafts: 18,
  languages: 10,
};

export default function LandingPage() {
  const { t } = useLanguage();
  const [activeSlide, setActiveSlide] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % LANDING_HERO_IMAGES.length);
    }, HERO_SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      title: t('landing.heroFeatureInstantTitle'),
      desc: t('landing.heroFeatureInstantDesc'),
    },
    {
      title: t('landing.heroFeatureMultilingualTitle'),
      desc: t('landing.heroFeatureMultilingualDesc'),
    },
    {
      title: t('landing.heroFeatureSourceTitle'),
      desc: t('landing.heroFeatureSourceDesc'),
    },
  ];

  const faqs = [
    { q: t('landing.faq1Q'), a: t('landing.faq1A') },
    { q: t('landing.faq2Q'), a: t('landing.faq2A') },
    { q: t('landing.faq3Q'), a: t('landing.faq3A') },
  ];

  return (
    <div className="landing-page">
      <section className="landing-hero-banner" aria-label={t('landing.headline')}>
        <div className="landing-hero-slides" aria-hidden="true">
          {LANDING_HERO_IMAGES.map((slide, index) => (
            <div
              key={slide.url}
              className={`landing-hero-slide ${index === activeSlide ? 'is-active' : ''}`}
              style={{ backgroundImage: `url(${slide.url})` }}
            />
          ))}
        </div>
        <div className="landing-hero-overlay" />
        <div className="landing-hero-banner-content">
          <span className="landing-badge landing-badge-hero">{t('landing.badge')}</span>
          <h1>{t('landing.headline')}</h1>
          <p className="landing-subheadline landing-subheadline-hero">{t('landing.subheadline')}</p>
          <button type="button" className="btn btn-gradient landing-cta landing-cta-hero" onClick={() => setUploadOpen(true)}>
            {t('landing.ctaStart')}
          </button>
        </div>
      </section>

      <div className="landing-page-body">
        <section className="landing-hero-features-section">
          <div className="landing-hero-features">
            {features.map((feature) => (
              <article key={feature.title} className="landing-feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-global">
          <p>{t('landing.globalSupportText')}</p>
          <div className="landing-lang-strip">
            {LANDING_LANG_STRIP.map((code) => (
              <span key={code}>{getLanguageLabel(code, t)}</span>
            ))}
          </div>
        </section>

        <section className="landing-section landing-try card">
          <h2>{t('landing.tryTitle')}</h2>
          <p>{t('landing.tryDescription')}</p>
          <button type="button" className="btn btn-gradient" onClick={() => setUploadOpen(true)}>
            {t('landing.ctaStart')}
          </button>
        </section>

        <section className="landing-section landing-preview">
          <div>
            <h2>{t('landing.previewTitle')}</h2>
            <p>{t('landing.previewDescription')}</p>
            <small>{t('landing.previewStatsIllustrative')}</small>
          </div>
          <div className="landing-preview-stats">
            <div className="landing-stat">
              <strong>{PREVIEW_STATS.articles}</strong>
              <span>{t('landing.previewStatArticles')}</span>
            </div>
            <div className="landing-stat">
              <strong>{PREVIEW_STATS.drafts}</strong>
              <span>{t('landing.previewStatDrafts')}</span>
            </div>
            <div className="landing-stat">
              <strong>{PREVIEW_STATS.languages}</strong>
              <span>{t('landing.previewStatLanguages')}</span>
            </div>
          </div>
        </section>

        <section className="landing-section landing-faq">
          <h2>{t('landing.faqTitle')}</h2>
          <div className="landing-faq-list">
            {faqs.map((item) => (
              <details key={item.q} className="landing-faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="landing-section landing-bottom-cta card">
          <h2>{t('landing.ctaBottom')}</h2>
          <button type="button" className="btn btn-gradient" onClick={() => setUploadOpen(true)}>
            {t('landing.ctaBottomButton')}
          </button>
        </section>

        <footer className="landing-footer">
          <p>{t('landing.footerTagline')}</p>
          <LanguageSelector compact />
        </footer>
      </div>

      <LandingUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
