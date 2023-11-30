import { Button, useMantineColorScheme } from "@mantine/core"
import { useCallback, useEffect } from "react"
import Moon from "../components/icons/Moon"
import Sun from "../components/icons/Sun"
import { useI18n } from "../util/i18n/i18n"


export function ThemePicker() {
    const i18n = useI18n()
    const { colorScheme, setColorScheme } = useMantineColorScheme()

    useEffect(() => {
        setTimeout(() => setColorScheme('auto'), 0)
        setTimeout(() => setColorScheme(colorScheme), 0)
    }, [])

    const toggle = useCallback(() => {
        setColorScheme(({ "light": "dark", "dark": "auto", "auto": "light" } as const)[colorScheme])
    }, [colorScheme])

    const labels = useCallback((c: "light" | "dark" | "auto") => {
        return { 'light': i18n`light`, 'dark': i18n`dark`, 'auto': i18n`auto` }[c]
    }, [i18n])

    const icons = useCallback((c: "light" | "dark" | "auto") => {
        return { 'light': <Sun />, 'dark': <Moon />, 'auto': <Moon /> }[c]
    }, [])

    return (
        <Button w={120} variant="outline" onClick={toggle} rightSection={icons(colorScheme)}>
            {labels(colorScheme)}
        </Button>
    )
}
