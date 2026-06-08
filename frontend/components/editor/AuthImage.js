'use client';

import { useEffect, useState } from 'react';
import { getToken } from '../../lib/auth';
import { normalizeImageUrl } from '../../lib/images';

export default function AuthImage({ src, alt = '', className = '' }) {
  const [blobUrl, setBlobUrl] = useState('');

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;

    async function load() {
      const token = getToken();
      const imageSrc = normalizeImageUrl(src);
      if (!imageSrc || !token) return;

      try {
        const response = await fetch(imageSrc, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok || cancelled) return;
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setBlobUrl(objectUrl);
      } catch {
        // ignore
      }
    }

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!blobUrl) {
    return <div className={`magazine-photo-skeleton skeleton ${className}`} />;
  }

  return <img src={blobUrl} alt={alt} className={className} loading="lazy" />;
}
