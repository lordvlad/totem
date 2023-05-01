import { useState } from "preact/hooks";

const query = '(prefers-color-scheme: dark)'

export function useSystemTheme() {
    const isDark = () => window.matchMedia(query).matches;
    const [theme, setTheme] = useState<'light' | 'dark'>(() => isDark() ? 'dark' : 'light')

    useState(() => {
        const handler = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? 'dark' : 'light')
        }
        const mql = window.matchMedia(query)
        mql.addEventListener("change", handler)
        return () => mql.removeEventListener("change", handler)
    })

    return theme
}

