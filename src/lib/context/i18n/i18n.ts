import { createContext } from "preact"
import { useCallback, useContext } from "preact/hooks"
import { useLocalStorageState } from "../../hooks/useLocalStorageState"

import de_DE from './de_DE.json'
import { zip } from "../../util/zip"

export const locales = {
    'en-US': 'english', // default
    'de-DE': 'deutsch',
} as const

type Locale = keyof typeof locales
type NonDefaultLocale = Exclude<Locale, 'en-US'>

const data: Record<NonDefaultLocale, Record<string, string>> = {
    'de-DE': de_DE
}

function getLocalizedLiterals(locale: Locale, literals: string[] | TemplateStringsArray) {
    const key = literals.join("{}")
    const localized = Array.from(locale in data && key in data[locale as NonDefaultLocale] ? data[locale as NonDefaultLocale][key].split(/\{\}/) : literals);
    return localized
}

export function useLocale() {
    const initialLocale = (((navigator.language as Locale) in locales) ? navigator.language : 'en-US') as Locale
    return useLocalStorageState('lang', initialLocale)
}

export const LocaleContext = createContext<Locale>("en-US")
export function useI18n() {
    const locale = useContext(LocaleContext)
    return useCallback((literals: TemplateStringsArray, ...placeholders: any[]) => {
        const localized = getLocalizedLiterals(locale, literals)
        return zip(localized, [...placeholders.map(String), ""]).join("")
    }, [locale])
}
