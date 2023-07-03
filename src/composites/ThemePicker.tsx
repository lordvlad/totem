import { Button } from "@mantine/core"
import { useMemo } from "react"
import { useThemeType } from "../hooks/useThemeType"
import { useI18n } from "../i18n/i18n"
import Moon from "../icons/Moon"
import Sun from "../icons/Sun"

export function ThemePicker() {
    const i18n = useI18n()
    const { toggle, chosen } = useThemeType()
    const icons = useMemo(() => ({ 'light': <Sun />, 'dark': <Moon />, 'auto': <Moon /> }), [])
    const labels = useMemo(() => ({ 'light': i18n`light`, 'dark': i18n`dark`, 'auto': i18n`auto` }), [i18n])

    return <Button
        w={120}
        variant="outline" onClick={toggle} rightIcon={icons[chosen]} > {labels[chosen]} </Button>
}
