import de_DE from './de_DE.json';

export const locales = {
  'en-US': 'English', // default
  'de-DE': 'Deutsch'
} as const

export type Locale = keyof typeof locales
export type NonDefaultLocale = Exclude<Locale, 'en-US'>

export function isKnownLocale(l: string): l is Locale {
  return l in locales
}

export const data: Record<NonDefaultLocale, Record<string, string>> = {
  'de-DE': de_DE
}
