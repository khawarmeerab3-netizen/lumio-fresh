'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useLangStore } from '@/stores/lang';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const { detectAndInit, language } = useLangStore();

  // On first mount: detect language and apply dir/lang attributes
  useEffect(() => {
    detectAndInit();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-apply whenever language changes (e.g. user switches mid-session)
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', language);
  }, [language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
