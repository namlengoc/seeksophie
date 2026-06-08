'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <div className="card">
          <div className="skeleton" style={{ height: 24, width: '40%' }} />
          <div className="skeleton" style={{ height: 16, width: '70%', marginTop: 12 }} />
        </div>
      </div>
    );
  }

  return children;
}
