'use client';

import AuthGuard from '../../components/AuthGuard';
import UploadPage from '../../components/UploadPage';

export default function UploadRoutePage() {
  return (
    <AuthGuard>
      <UploadPage />
    </AuthGuard>
  );
}
