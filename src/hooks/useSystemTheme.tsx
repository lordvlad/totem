import { useEffect, useState } from "react";

const query = '(prefers-color-scheme: dark)'
const mql = window.matchMedia(query)

export function useSystemTheme() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => mql.matches ? 'dark' : 'light')

    useEffect(() => {
        const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light')
        mql.addEventListener("change", handler)
        return () => mql.removeEventListener("change", handler)
    })

    return theme
}

