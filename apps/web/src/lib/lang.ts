'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n, { type LangCode, isRTL, mapBrowserLang } from '@/lib/i18n';
import { client } from '@/lib/api';

// ─── Store ────────────────────────────────────────────────────────────────────

interface LangState {
  language: LangCode;
  isRTL: boolean;
}

interface LangActions {
  setLanguage: (code: LangCode, saveToProfile?: boolean) => Promise<void>;
  detectAndInit: () => void;
}

export const useLangStore = create<LangState & LangActions>()(
  persist(
    (set, get) => ({
      language: 'en',
      isRTL: false,

      setLanguage: async (code, saveToProfile = false) => {
        const rtl = isRTL(code);
        set({ language: code, isRTL: rtl });

        // Update i18next
        await i18n.changeLanguage(code);

        // Apply RTL to <html>
        applyDirToDOM(code);

        // Persist to backend (fire-and-forget on failure)
        if (saveToProfile) {
          client
            .patch('/api/auth/me', { selected_language: code })
            .catch(() => {});
        }
      },

      detectAndInit: () => {
        const stored = get().language;
        // If already set (hydrated from localStorage), just apply DOM
        if (stored && stored !== 'en') {
          applyDirToDOM(stored);
          i18n.changeLanguage(stored);
          return;
        }

        // Auto-detect from browser on first visit
        if (typeof navigator !== 'undefined') {
          const detected = mapBrowserLang(navigator.language);
          if (detected !== 'en') {
            get().setLanguage(detected);
          } else {
            applyDirToDOM('en');
          }
        }
      },
    }),
    {
      name: 'lumio-lang',
      partialize: (state) => ({ language: state.language }),
    },
  ),
);

// ─── DOM Helper ───────────────────────────────────────────────────────────────

function applyDirToDOM(lang: string): void {
  if (typeof document === 'undefined') return;

  const html = document.documentElement;
  const body = document.body;
  const rtl = isRTL(lang);

  html.setAttribute('lang', lang);
  html.setAttribute('dir', rtl ? 'rtl' : 'ltr');

  if (rtl) {
    body.classList.add('rtl');
    body.classList.remove('ltr');
  } else {
    body.classList.add('ltr');
    body.classList.remove('rtl');
  }
}
