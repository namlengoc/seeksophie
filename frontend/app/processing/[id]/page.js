'use client';

import { Suspense } from 'react';
import ProcessingView from '../../../components/ProcessingView';

export default function ProcessingPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: '3rem 0' }}>
          <div className="card">
            <div className="skeleton" style={{ height: 24, width: '40%' }} />
          </div>
        </div>
      }
    >
      <ProcessingView articleId={params.id} />
    </Suspense>
  );
}
