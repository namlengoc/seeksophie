'use client';

import AuthGuard from '../../../components/AuthGuard';
import ArticleEditor from '../../../components/editor/ArticleEditor';

export default function EditorPage({ params }) {
  return (
    <AuthGuard>
      <ArticleEditor articleId={params.id} />
    </AuthGuard>
  );
}
