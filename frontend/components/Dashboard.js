'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchArticles } from '../lib/api';
import { getUser } from '../lib/auth';
import { formatUserError, roleLabel, statusLabel } from '../lib/i18n';
import { useLanguage } from '../providers/LanguageProvider';

export default function Dashboard() {
  const { t } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getUser();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchArticles();
        if (!cancelled) setArticles(data.data || []);
      } catch (err) {
        if (!cancelled) setError(formatUserError(err, t, 'dashboard.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const roleHint =
    user?.role === 'author' ? t('dashboard.authorHint') : t('dashboard.editorHint');

  return (
    <div>
      <section className="hero">
        <h1>{t('dashboard.title')}</h1>
        <p>
          {t('dashboard.signedInAs', {
            name: user?.name || '',
            role: roleLabel(t, user?.role || ''),
          })}{' '}
          {roleHint}
        </p>
      </section>

      <div className="card">
        {loading ? (
          <div>
            <div className="skeleton" style={{ height: 20, width: '100%' }} />
            <div className="skeleton" style={{ height: 20, width: '100%', marginTop: 10 }} />
            <div className="skeleton" style={{ height: 20, width: '100%', marginTop: 10 }} />
          </div>
        ) : null}

        {error ? <p className="error-text">{error}</p> : null}

        {!loading && !articles.length ? (
          <div className="empty-state">
            <p>{t('dashboard.empty')}</p>
            <Link href="/upload" className="btn btn-primary">
              {t('dashboard.uploadCta')}
            </Link>
          </div>
        ) : null}

        {!loading && articles.length ? (
          <table className="article-table">
            <thead>
              <tr>
                <th>{t('dashboard.tableTitle')}</th>
                <th>{t('dashboard.tableStatus')}</th>
                <th>{t('dashboard.tableUpdated')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>{article.title}</td>
                  <td>
                    <span className={`badge badge-${article.status}`}>
                      {statusLabel(t, article.status)}
                    </span>
                  </td>
                  <td>
                    {article.updated_at
                      ? new Date(article.updated_at).toLocaleString()
                      : t('common.emDash')}
                  </td>
                  <td>
                    {['draft', 'published', 'under_review'].includes(article.status) ? (
                      <Link href={`/editor/${article.id}`} className="article-link">
                        {t('dashboard.openEditor')}
                      </Link>
                    ) : ['pending', 'processing', 'rejected', 'failed'].includes(article.status) ? (
                      <Link href={`/processing/${article.id}`} className="article-link">
                        {t('dashboard.viewProgress')}
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>{t('common.emDash')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
