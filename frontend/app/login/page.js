'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '../../components/AuthLayout';
import LoginForm from '../../components/LoginForm';
import { isAuthenticated } from '../../lib/auth';
import { useLanguage } from '../../providers/LanguageProvider';

function LoginPageInner() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <Suspense
      fallback={
        <AuthLayout>
          <div className="auth-card card">
            <p style={{ color: 'var(--muted)' }}>{t('common.loading')}</p>
          </div>
        </AuthLayout>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
