import { useSystemTheme } from "./useSystemTheme";
import { useLocalStorage } from "@mantine/hooks";
import { ColorScheme } from "@mantine/core";

export function useColorScheme() {
    const sysTheme = useSystemTheme()
    const [theme, setTheme] = useLocalStorage<ColorScheme | undefined>({ key: 'mantine-color-scheme', defaultValue: undefined })


    return { theme: theme ?? sysTheme, raw: theme, setTheme }
}