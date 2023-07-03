import { createContext, useCallback, useContext } from "react"
import { useLocalStorageState } from "../hooks/useLocalStorageState"


// FIXME find a way to make this lazy

import { zip } from "../util/zip"
import de_DE from './de_DE.json'

export const locales = {
    'en-US': 'english', // default
    'de-DE': 'deutsch',
} as const

export type Locale = keyof typeof locales
export type NonDefaultLocale = Exclude<Locale, 'en-US'>

const data: Record<NonDefaultLocale, Record<string, string>> = {
    'de-DE': de_DE
}

export function isKnownLocale(l: string): l is Locale {
    return l in locales
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
