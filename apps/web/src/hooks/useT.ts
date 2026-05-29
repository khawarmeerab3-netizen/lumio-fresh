/**
 * Typed translation hook for the 'common' namespace.
 *
 * Usage:
 *   const t = useT();
 *   t('nav.dashboard')         // → "Dashboard" / "لوحة التحكم" etc.
 *   t('challenge.card.day_of', { current: 3, total: 21 })
 */

import { useTranslation } from 'react-i18next';

export function useT() {
  const { t } = useTranslation('common');
  return t;
}

/**
 * Returns the current language code and whether the layout is RTL.
 * Use this when components need to conditionally flip styles.
 *
 * Usage:
 *   const { lang, rtl } = useLang();
 */
export { useLangStore } from '@/stores/lang';

import { useLangStore } from '@/stores/lang';

export function useLang() {
  const { language, isRTL } = useLangStore();
  return { lang: language, rtl: isRTL };
}
