import { useCallback } from "react";
import { data, type Locale, type NonDefaultLocale } from "./locales";
import { useLocale } from "./useLocale";

function getLocalizedLiterals(locale: Locale, literals: string[] | TemplateStringsArray) {
  const key = literals.join('{}')
  const localized = Array.from(locale in data && key in data[locale as NonDefaultLocale] ? data[locale as NonDefaultLocale][key].split(/\{\}/) : literals)
  return localized
}

export function useI18n() {
  const locale = useLocale()
  return useCallback((literals: TemplateStringsArray, ...placeholders: any[]) => {
    return getLocalizedLiterals(locale, literals)
      .map((s, i) => s + (placeholders[i] ?? ''))
      .join('')
  }, [locale])
}
