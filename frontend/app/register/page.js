'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '../../components/AuthLayout';
import RegisterForm from '../../components/RegisterForm';
import { isAuthenticated } from '../../lib/auth';
import { useLanguage } from '../../providers/LanguageProvider';

function RegisterPageInner() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}

export default function RegisterPage() {
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
      <RegisterPageInner />
    </Suspense>
  );
}
