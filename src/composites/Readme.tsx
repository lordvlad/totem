import { Suspense, lazy } from 'react';
import { useLocale } from '../i18n/i18n';
import { Loader } from '@mantine/core';

// @ts-ignore
const Readme_en_EN = lazy(() => import('../../README.md'))
// @ts-ignore
const Readme_de_DE = lazy(() => import('../../README.de_DE.md'))

export function Readme() {
    const locale = useLocale()[0]
    return (
        <Suspense fallback={<Loader />} >
            {({
                'en-US': <Readme_en_EN />,
                'de-DE': <Readme_de_DE />
            }[locale] || <Readme_en_EN />)}
        </Suspense>
    )
}