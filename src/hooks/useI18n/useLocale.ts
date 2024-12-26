import { proxy, subscribe, useSnapshot } from "valtio"
import { isKnownLocale, type Locale } from "./locales"

const localeProxy = proxy<{ locale: Locale }>({
  locale:
    (localStorage.getItem('lang')
      ?? (isKnownLocale(navigator.language)
        ? navigator.language
        : 'en-US')
    ) as Locale
})

subscribe(localeProxy, () => {
  document.documentElement.lang = localeProxy.locale
  localStorage.setItem('lang', localeProxy.locale)
})


export function useLocale() {
  return useSnapshot(localeProxy).locale
}

export function setLocale(locale: Locale) {
  localeProxy.locale = locale
}
