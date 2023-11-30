import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core'
import { createRoot } from 'react-dom/client'
import { App } from './pages/App'
import { PrintLayout } from './pages/PrintLayout'
import { LocalStorageOptionsProvider } from './stores/options'
import { LocaleContext, useLocale } from './util/i18n/i18n'

export function Main() {
    const lang = useLocale()[0]

    return (
        <LocaleContext.Provider value={lang || "en-US"}>
            <MantineProvider>
                <LocalStorageOptionsProvider>
                    <App />
                    <PrintLayout />
                </LocalStorageOptionsProvider>
            </MantineProvider>
        </LocaleContext.Provider>
    )
}

const root = createRoot(document.getElementById('app') as HTMLElement)
root.render(<Main />)
