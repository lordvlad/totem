import { Center, Container, Drawer, Loader } from '@mantine/core';
import { Suspense, lazy } from 'react';
import { useLocale } from '../util/i18n/i18n';
import { useHelpPanel } from '../stores/help';

// @ts-ignore
const Readme_en_EN = lazy(() => import('../../README.md'))
// @ts-ignore
const Readme_de_DE = lazy(() => import('../../README.de_DE.md'))


export function HelpPanel() {
    const [showHelp, setShowHelp] = useHelpPanel()
    const locale = useLocale()[0]

    return (
        <Drawer opened={showHelp} onClose={() => setShowHelp(false)} position="top" size="100%">
            <Container>
                <Suspense fallback={<Center><Loader /></Center>} >
                    {(() => {
                        switch (locale) {
                            case 'de-DE': return <Readme_de_DE />;
                            default: return <Readme_en_EN />;
                        }
                    })()}
                </Suspense>
            </Container>
        </Drawer>
    )
}
