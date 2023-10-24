import { Button, ColorScheme } from "@mantine/core"
import { useCallback } from "react"
import { useColorScheme } from "../hooks/useThemeType"
import { useI18n } from "../i18n/i18n"
import Moon from "../icons/Moon"
import Sun from "../icons/Sun"


export function ThemePicker() {
    const i18n = useI18n()
    const { setTheme, raw } = useColorScheme()

    function toggle() {
        setTheme((t: ColorScheme | undefined) => {
            switch (t) {
                case 'dark': return 'light'
                case 'light': return undefined
                default: return 'dark'
            }
        })
    }

    const labels = useCallback((c: ColorScheme | undefined) => {
        return c ? { 'light': i18n`light`, 'dark': i18n`dark` }[c] : i18n`auto`
    }, [i18n])
    const icons = useCallback((c: ColorScheme | undefined) => {
        return c ? { 'light': <Sun />, 'dark': <Moon /> }[c] : <Moon />
    }, [])

    return <Button
        w={120}
        variant="outline"
        onClick={toggle}
        rightIcon={icons(raw)}> {labels(raw)} </Button>
}
