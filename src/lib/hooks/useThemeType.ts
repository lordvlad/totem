import { useLocalStorageState } from "./useLocalStorageState";
import { useSystemTheme } from "./useSystemTheme";

const cycle = {
    'auto': 'dark',
    'dark': 'light',
    'light': 'auto'
} as const

export function useThemeType() {
    const sysTheme = useSystemTheme()
    const [theme, setTheme] = useLocalStorageState<'light' | 'dark' | 'auto'>('theme', sysTheme)
    return [theme, theme === 'auto' ? sysTheme : theme, () => setTheme(cycle[theme])] as const
}