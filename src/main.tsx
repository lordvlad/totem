import { createRoot } from 'react-dom/client'
import { LocaleContext, useLocale } from './i18n/i18n'
import { useColorScheme } from './hooks/useThemeType'
import { App } from './app'
import { PrintLayout } from './pages/PrintLayout'
import { LocalStorageOptionsProvider } from './library/options'
import { ColorSchemeProvider, MantineProvider } from '@mantine/core'

export function Main() {
    const lang = useLocale()[0]
    const { theme, setTheme } = useColorScheme()

    return (
        <LocaleContext.Provider value={lang}>
            <ColorSchemeProvider colorScheme={theme} toggleColorScheme={setTheme}>
                <MantineProvider theme={{ colorScheme: theme }} withGlobalStyles withNormalizeCSS>
                    <LocalStorageOptionsProvider>
                        <App />
                        <PrintLayout />
                    </LocalStorageOptionsProvider>
                </MantineProvider>
            </ColorSchemeProvider>
        </LocaleContext.Provider>
    )
}

const root = createRoot(document.getElementById('app') as HTMLElement)
root.render(<Main />)
