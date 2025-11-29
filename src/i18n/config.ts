export const locales = ['da', 'en', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'da';

export const localeNames: Record<Locale, string> = {
  da: 'Dansk',
  en: 'English',
  de: 'Deutsch',
};

