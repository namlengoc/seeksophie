import { claimGuestArticle } from './api';
import {
  clearAuthResumeFlags,
  getOrCreateGuestToken,
  getPendingArticleId,
  readArticleIdFromSearch,
  resolveAuthRedirectPath,
  shouldClaimArticleAfterAuth,
  shouldResumeArticleAfterAuth,
  readSafeNextHref,
} from './guest-article';

export async function finalizeGuestArticleAuth(articleId, router) {
  try {
    await claimGuestArticle(articleId, getOrCreateGuestToken());
  } catch {
    // Keep success path stable even if claim fails.
  }
  clearAuthResumeFlags();
  router.replace(`/editor/${articleId}`);
}

export async function finalizeAuthSession(router) {
  const articleIdFromUrl =
    typeof window !== 'undefined' ? readArticleIdFromSearch(window.location.search) : null;
  const pendingArticleId = articleIdFromUrl ?? getPendingArticleId();
  const preferredNext = readSafeNextHref();

  if (shouldClaimArticleAfterAuth(articleIdFromUrl) && pendingArticleId !== null) {
    try {
      await claimGuestArticle(pendingArticleId, getOrCreateGuestToken());
    } catch {
      // Keep login success path stable even if claim fails.
    }
  }

  const resumeAfterAuth =
    shouldResumeArticleAfterAuth() || articleIdFromUrl !== null || preferredNext !== null;
  const redirectPath = resolveAuthRedirectPath({
    preferredNext,
    pendingArticleId,
    resumeAfterAuth,
  });

  clearAuthResumeFlags();
  router.replace(redirectPath);
}
