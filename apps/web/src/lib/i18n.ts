import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// ─── Supported Languages ──────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',    nativeName: 'English',    flag: '🇬🇧', rtl: false },
  { code: 'ar', name: 'Arabic',     nativeName: 'العربية',    flag: '🇸🇦', rtl: true  },
  { code: 'ur', name: 'Urdu',       nativeName: 'اردو',       flag: '🇵🇰', rtl: true  },
  { code: 'hi', name: 'Hindi',      nativeName: 'हिंदी',      flag: '🇮🇳', rtl: false },
  { code: 'es', name: 'Spanish',    nativeName: 'Español',    flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'French',     nativeName: 'Français',   flag: '🇫🇷', rtl: false },
  { code: 'tr', name: 'Turkish',    nativeName: 'Türkçe',     flag: '🇹🇷', rtl: false },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', rtl: false },
] as const;

export type LangCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const RTL_LANGUAGES = new Set<LangCode>(['ar', 'ur']);

export const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

/** Returns true if the language is RTL */
export function isRTL(lang: string): boolean {
  return RTL_LANGUAGES.has(lang as LangCode);
}

/** Map browser locale to supported language code, fallback 'en' */
export function mapBrowserLang(browserLang: string): LangCode {
  // Exact match first
  const exact = browserLang.toLowerCase().split('-')[0];
  if (SUPPORTED_CODES.includes(exact as LangCode)) return exact as LangCode;

  // Regional variant map (e.g. 'zh-TW' → not supported → 'en')
  const regionMap: Record<string, LangCode> = {
    'pt': 'es', // Portuguese → Spanish as closest
  };
  return regionMap[exact] ?? 'en';
}

// ─── i18next Init ─────────────────────────────────────────────────────────────

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_CODES,
    defaultNS: 'common',
    ns: ['common'],

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      // Order: stored preference → browser navigator → fallback
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'lumio-lang',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React handles XSS
    },

    react: {
      useSuspense: false, // prevent SSR flash
    },
  });

export default i18n;
