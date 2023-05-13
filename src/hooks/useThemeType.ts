import { useCallback } from "react";
import { useLocalStorageState } from "./useLocalStorageState";
import { useSystemTheme } from "./useSystemTheme";

const options = ['auto', 'dark', 'light'] as const
export type ThemeOptions = typeof options[number]
export type Theme = Omit<ThemeOptions, 'auto'>

export function useThemeType() {
    const sysTheme = useSystemTheme()
    const [theme, setTheme] = useLocalStorageState<ThemeOptions>('theme', options[0])
    const toggle = useCallback(() => setTheme(options[(options.indexOf(theme) + 1) % options.length]), [theme, sysTheme])
    return { theme: theme === 'auto' ? sysTheme : theme, chosen: theme, toggle }
}