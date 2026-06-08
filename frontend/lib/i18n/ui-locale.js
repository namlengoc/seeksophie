export const UI_LOCALE_STORAGE_KEY = 'seeksophie_ui_locale';
export const DEFAULT_UI_LOCALE = 'en';

export function resolveBrowserOrStoredLocale() {
  if (typeof window === 'undefined') {
    return DEFAULT_UI_LOCALE;
  }

  const stored = window.localStorage.getItem(UI_LOCALE_STORAGE_KEY);
  if (stored) {
    return stored;
  }

  const browser = (navigator.language || DEFAULT_UI_LOCALE).toLowerCase();
  if (browser.startsWith('zh')) return 'zh-cn';
  if (browser.startsWith('vi')) return 'vi';
  if (browser.startsWith('ja')) return 'ja';
  if (browser.startsWith('ko')) return 'ko';
  if (browser.startsWith('th')) return 'th';
  if (browser.startsWith('id')) return 'id';
  if (browser.startsWith('es')) return 'es';
  if (browser.startsWith('fr')) return 'fr';
  if (browser.startsWith('de')) return 'de';

  return DEFAULT_UI_LOCALE;
}

export function writeUiLocaleCookie(locale) {
  if (typeof document === 'undefined') return;
  document.cookie = `seeksophie_locale=${locale};path=/;max-age=31536000;samesite=lax`;
}
