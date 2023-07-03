import { createRoot } from 'react-dom/client'
import { LocaleContext, useLocale } from './i18n/i18n'
import { useThemeType } from './hooks/useThemeType'
import { App } from './app'
import { PrintLayout } from './pages/PrintLayout'
import { LocalStorageOptionsProvider } from './library/options'
import { MantineProvider } from '@mantine/core'

export function Main() {
    const lang = useLocale()[0]
    const { theme } = useThemeType()

    return (
        <LocaleContext.Provider value={lang}>
            <MantineProvider theme={{ colorScheme: theme }} withGlobalStyles withNormalizeCSS>
                <LocalStorageOptionsProvider>
                    <PrintLayout />
                    <App className="no-print app-inner" />
                </LocalStorageOptionsProvider>
            </MantineProvider>
        </LocaleContext.Provider>
    )
}

const root = createRoot(document.getElementById('app') as HTMLElement)
root.render(<Main />)
