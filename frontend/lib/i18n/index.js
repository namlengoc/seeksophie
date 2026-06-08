import de from './translations/de.json';
import en from './translations/en.json';
import es from './translations/es.json';
import fr from './translations/fr.json';
import id from './translations/id.json';
import ja from './translations/ja.json';
import ko from './translations/ko.json';
import th from './translations/th.json';
import vi from './translations/vi.json';
import zhCn from './translations/zh-cn.json';

export const dictionaries = {
  en,
  vi,
  ja,
  ko,
  'zh-cn': zhCn,
  th,
  id,
  es,
  fr,
  de,
};

export const SUPPORTED_UI_LOCALES = Object.keys(dictionaries);

export const UI_LOCALE_LABELS = {
  en: 'English',
  vi: 'Tiếng Việt',
  ja: '日本語',
  ko: '한국어',
  'zh-cn': '简体中文',
  th: 'ไทย',
  id: 'Bahasa Indonesia',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

export const UI_LOCALE_FLAGS = {
  en: '🇺🇸',
  vi: '🇻🇳',
  ja: '🇯🇵',
  ko: '🇰🇷',
  'zh-cn': '🇨🇳',
  th: '🇹🇭',
  id: '🇮🇩',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
};

export const CONTENT_LANGUAGE_CODES = SUPPORTED_UI_LOCALES;

export function isSupportedUiLocale(code) {
  return Object.prototype.hasOwnProperty.call(dictionaries, code);
}

export function getNestedMessage(dict, key) {
  return dict[key] ?? key;
}

export function createTranslator(locale) {
  const dict = dictionaries[locale] || dictionaries.en;

  return function t(key, vars = {}) {
    let message = getNestedMessage(dict, key);
    if (message === key) {
      message = getNestedMessage(dictionaries.en, key);
    }
    return Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value)),
      message
    );
  };
}

export function getLanguageLabel(code, t) {
  return t(`language.${code}`) || UI_LOCALE_LABELS[code] || code;
}

export function statusLabel(t, status) {
  const key = `dashboard.status.${status}`;
  const label = t(key);
  return label === key ? status : label;
}

export function roleLabel(t, role) {
  const key = `role.${role}`;
  const label = t(key);
  return label === key ? role : label;
}

export const LANDING_LANG_STRIP = ['en', 'vi', 'ja', 'ko', 'fr'];
