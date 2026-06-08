import { API_URL } from './constants';
import { getToken, clearAuth } from './auth';

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { Accept: 'application/json', ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
  });

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (response.status === 401) {
    clearAuth();
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.detail ||
      (payload?.errors ? Object.values(payload.errors).flat().join(', ') : null) ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

export function login(email, password) {
  return apiFetch('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(name, email, password) {
  return apiFetch('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function claimGuestArticle(id, guestToken) {
  return apiFetch(`/v1/articles/${id}/claim`, {
    method: 'POST',
    body: JSON.stringify({ guest_token: guestToken }),
  });
}

export async function publicApiFetch(path, options = {}) {
  const headers = { Accept: 'application/json', ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
  });

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.detail ||
      (payload?.errors ? Object.values(payload.errors).flat().join(', ') : null) ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

export function guestDetectDocumentLanguage(document, guestToken) {
  const formData = new FormData();
  formData.append('document', document);

  return publicApiFetch('/v1/guest/articles/detect-language', {
    method: 'POST',
    body: formData,
    headers: {},
  });
}

export function guestUploadArticle(document, images = [], sourceLang = 'en', guestToken) {
  const formData = new FormData();
  formData.append('guest_token', guestToken);
  formData.append('document', document);
  formData.append('source_lang', sourceLang);
  images.forEach((image, index) => formData.append(`images[${index}]`, image));

  return publicApiFetch('/v1/guest/articles/upload', {
    method: 'POST',
    body: formData,
    headers: {},
  });
}

export function fetchGuestArticleStatus(guestToken, id) {
  return publicApiFetch(`/v1/guest/articles/${encodeURIComponent(guestToken)}/${id}/status`);
}

export function fetchMe() {
  return apiFetch('/v1/auth/me');
}

export function fetchArticles() {
  return apiFetch('/v1/articles');
}

export function fetchArticle(id) {
  return apiFetch(`/v1/articles/${id}`);
}

export function fetchArticleStatus(id) {
  return apiFetch(`/v1/articles/${id}/status`);
}

export function detectDocumentLanguage(document) {
  const formData = new FormData();
  formData.append('document', document);

  return apiFetch('/v1/articles/detect-language', {
    method: 'POST',
    body: formData,
    headers: {},
  });
}

export function uploadArticle(document, images = [], sourceLang = 'en') {
  const formData = new FormData();
  formData.append('document', document);
  formData.append('source_lang', sourceLang);
  images.forEach((image, index) => formData.append(`images[${index}]`, image));

  return apiFetch('/v1/articles/upload', {
    method: 'POST',
    body: formData,
    headers: {},
  });
}

export function updateArticle(id, data) {
  return apiFetch(`/v1/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
