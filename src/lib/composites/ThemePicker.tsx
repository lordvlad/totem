import { Button } from "@geist-ui/core"
import { useI18n } from "../context/i18n/i18n"
import { useThemeType } from "../hooks/useThemeType"
import { Moon, Sun } from "@geist-ui/icons"

export function ThemePicker() {
    const i18n = useI18n()
    const [themeType, _, toggleThemeType] = useThemeType()
    return (
        <Button
            auto
            iconRight={{ 'light': <Sun />, 'dark': <Moon />, 'auto': <Moon />, }[themeType]}
            onClick={() => toggleThemeType()}
        >{({ 'light': i18n`light`, 'dark': i18n`dark`, 'auto': i18n`auto` }[themeType])}</Button>
    )
}
