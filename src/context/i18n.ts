import i18next from 'i18next';

export type Lang = 'en' | 'hi' | 'mr' | 'fr' | 'ar';

export function t(lang: string | Lang, key: string): string {
  // We use i18next to translate the key.
  // By passing { lng: lang }, we ensure it translates to the explicitly requested language.
  return i18next.t(key, { lng: lang, ns: 'common' });
}
