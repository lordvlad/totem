import { render } from 'preact'
import { LocaleContext, useLocale } from './i18n/i18n'
import { useThemeType } from './hooks/useThemeType'
import { CssBaseline, GeistProvider } from '@geist-ui/core'
import { App } from './app'
import { PrintLayout } from './pages/PrintLayout'

export function Main() {
    const lang = useLocale()[0]
    const { theme } = useThemeType()

    return (
        <LocaleContext.Provider value={lang}>
            <GeistProvider themeType={theme}>
                <CssBaseline />
                <PrintLayout />
                <App className="no-print" />
            </GeistProvider >
        </LocaleContext.Provider>
    )
}

render(<Main />, document.getElementById('app') as HTMLElement)
