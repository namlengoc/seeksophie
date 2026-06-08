import { API_URL } from './constants';

/** Rewrite backend image URLs to NEXT_PUBLIC_API_URL (fixes localhost + http/https mismatch). */
export function normalizeImageUrl(src) {
  if (!src) return '';
  const base = API_URL.replace(/\/$/, '');
  try {
    const url = new URL(src, base);
    const isArticleImage = /\/api\/v1\/articles\/\d+\/images\/\d+/.test(url.pathname);
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const apiOrigin = new URL(base);
    const schemeMismatch =
      url.hostname === apiOrigin.hostname && url.protocol !== apiOrigin.protocol;

    if (isArticleImage || isLocalhost || schemeMismatch) {
      return `${base}${url.pathname}${url.search}`;
    }
    return url.href;
  } catch {
    if (src.startsWith('/')) {
      return `${base}${src}`;
    }
    return src;
  }
}

export function buildImageLookup(images = []) {
  const lookup = {};

  for (const image of images) {
    if (image.url) {
      const url = normalizeImageUrl(image.url);
      if (image.filename) lookup[image.filename] = url;
      if (image.stored_name) lookup[image.stored_name] = url;
    }
  }

  return lookup;
}

export function resolveImageUrl(lookup, name) {
  if (!name || !lookup) return null;
  return lookup[name] || null;
}
