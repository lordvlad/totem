import { Center, Loader, Container, Drawer } from '@mantine/core'

import { useGlobalState } from '../hooks/useGlobalState'
import { Suspense, lazy } from 'react';
import { useLocale } from '../i18n/i18n';

// @ts-ignore
const Readme_en_EN = lazy(() => import('../../README.md'))
// @ts-ignore
const Readme_de_DE = lazy(() => import('../../README.de_DE.md'))

function Readme() {
    const locale = useLocale()[0]
    return (
        <Suspense fallback={<Center><Loader /></Center>} >
            {({
                'en-US': <Readme_en_EN />,
                'de-DE': <Readme_de_DE />
            }[locale] || <Readme_en_EN />)}
        </Suspense>
    )
}

export function HelpPanel() {
    const [showHelp, setShowHelp] = useGlobalState("help", false)

    return (
        <Drawer opened={showHelp} onClose={() => setShowHelp(false)} position="top" size="100%">
            <Container>
                <Readme />
            </Container>
        </Drawer>
    )
}
