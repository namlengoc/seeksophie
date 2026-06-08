'use client';

const GUEST_TOKEN_KEY = 'seeksophie:guestToken';
const PENDING_ARTICLE_ID_KEY = 'seeksophie:pendingArticleId';
const RESUME_AFTER_AUTH_KEY = 'seeksophie:resumeAfterAuth';

function randomToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateGuestToken() {
  if (typeof window === 'undefined') return '';
  const existing = window.localStorage.getItem(GUEST_TOKEN_KEY);
  if (existing && existing.length >= 16) return existing;
  const next = randomToken();
  window.localStorage.setItem(GUEST_TOKEN_KEY, next);
  return next;
}

export function getPendingArticleId() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(PENDING_ARTICLE_ID_KEY);
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) ? id : null;
}

export function setPendingArticleId(articleId) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PENDING_ARTICLE_ID_KEY, String(articleId));
}

export function markArticleResumeAfterAuth(articleId) {
  setPendingArticleId(articleId);
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RESUME_AFTER_AUTH_KEY, '1');
}

export function shouldResumeArticleAfterAuth() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(RESUME_AFTER_AUTH_KEY) === '1';
}

export function readArticleIdFromSearch(search) {
  const raw = new URLSearchParams(search).get('article_id');
  const id = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(id) ? id : null;
}

export function readGuestTokenFromSearch(search) {
  return new URLSearchParams(search).get('guest_token') || '';
}

export function persistGuestTokenFromSearch(search) {
  const token = readGuestTokenFromSearch(search);
  if (!token || token.length < 16 || typeof window === 'undefined') return;
  window.localStorage.setItem(GUEST_TOKEN_KEY, token);
}

export function readSafeNextHref() {
  if (typeof window === 'undefined') return null;
  const n = new URLSearchParams(window.location.search).get('next');
  if (!n || n.trim() === '') return null;
  let decoded = n;
  try {
    decoded = decodeURIComponent(n);
  } catch {
    return null;
  }
  return decoded.startsWith('/') && !decoded.startsWith('//') ? decoded : null;
}

export function resolveAuthRedirectPath({ preferredNext, pendingArticleId, resumeAfterAuth }) {
  if (preferredNext) {
    return preferredNext;
  }
  const shouldResume =
    resumeAfterAuth === undefined ? shouldResumeArticleAfterAuth() : resumeAfterAuth;
  if (shouldResume && pendingArticleId !== null && Number.isFinite(pendingArticleId)) {
    return `/editor/${pendingArticleId}`;
  }
  return '/dashboard';
}

export function clearAuthResumeFlags() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PENDING_ARTICLE_ID_KEY);
  window.localStorage.removeItem(RESUME_AFTER_AUTH_KEY);
}

export function shouldClaimArticleAfterAuth(articleIdFromUrl) {
  if (articleIdFromUrl !== null) {
    return true;
  }
  return shouldResumeArticleAfterAuth() && getPendingArticleId() !== null;
}

export function buildLoginUrlForGuestArticle(articleId) {
  markArticleResumeAfterAuth(articleId);
  const params = new URLSearchParams({
    article_id: String(articleId),
    next: `/editor/${articleId}`,
  });
  return `/login?${params.toString()}`;
}

export function discardStalePendingArticleWithoutResume() {
  if (typeof window === 'undefined') return;
  if (!shouldResumeArticleAfterAuth() && getPendingArticleId() !== null) {
    clearAuthResumeFlags();
  }
}

export function primeAuthResumeFromSearch(search) {
  const articleId = readArticleIdFromSearch(search);
  if (articleId !== null) {
    markArticleResumeAfterAuth(articleId);
  }
}
