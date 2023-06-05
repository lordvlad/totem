import { Button } from "@geist-ui/core"
import { Moon, Sun } from "@geist-ui/icons"
import { useI18n } from "../i18n/i18n"
import { useThemeType } from "../hooks/useThemeType"

export function ThemePicker() {
    const i18n = useI18n()
    const { toggle, chosen } = useThemeType()
    return (
        // @ts-expect-error
        <Button auto onClick={toggle} iconRight={{ 'light': <Sun />, 'dark': <Moon />, 'auto': <Moon />, }[chosen]} >
            {({ 'light': i18n`light`, 'dark': i18n`dark`, 'auto': i18n`auto` }[chosen])}
        </Button>
    )
}
