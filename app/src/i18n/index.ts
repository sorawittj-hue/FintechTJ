/**
 * i18n Configuration
 *
 * Internationalization setup using i18next with:
 * - Browser language detection
 * - English (default) and Thai translations
 * - Lazy-loaded language resources
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en';
import th from './locales/th';

const STORAGE_KEY = 'quantai-language';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      th: { translation: th },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'th'],
    interpolation: {
      escapeValue: false, // React already handles XSS
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false, // Prevent suspense flash on language change
    },
  });

// Update HTML lang attribute when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.setAttribute('lang', lng);
  document.documentElement.setAttribute('dir', 'ltr');
});

// Set initial lang attribute
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('lang', i18n.language || 'en');
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
] as const;

export default i18n;
