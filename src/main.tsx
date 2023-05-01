import { render } from 'preact'
import { LocaleContext, useLocale } from './lib/context/i18n/i18n'
import { useThemeType } from './lib/hooks/useThemeType'
import { CssBaseline, GeistProvider } from '@geist-ui/core'
import { App } from './app'
import { PrintLayout } from './pages/PrintLayout'

export function Main() {
    const lang = useLocale()[0]
    const themeType = useThemeType()[1]

    return (
        <LocaleContext.Provider value={lang}>
            <GeistProvider themeType={themeType}>
                <CssBaseline />
                <PrintLayout />
                <App className="no-print" />
            </GeistProvider >
        </LocaleContext.Provider>
    )
}

render(<Main />, document.getElementById('app') as HTMLElement)
