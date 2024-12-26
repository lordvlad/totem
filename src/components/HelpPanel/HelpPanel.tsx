import { Center, Container, Drawer, Loader } from '@mantine/core'
import { Suspense } from 'react'
// @ts-ignore
import Readme_de_DE from '../../../README.de_DE.md'
// @ts-ignore
import Readme_en_EN from '../../../README.md'
import { useLocale } from '../../hooks/useI18n'
import { useHelpPanel } from './useHelpPanel'

export function HelpPanel() {
  const [open, setOpen] = useHelpPanel()
  const locale = useLocale()

  return (
    <Drawer opened={open} onClose={() => setOpen(false)} position='top' size='100%'>
      <Container>
        <Suspense fallback={<Center><Loader /></Center>}>
          {(() => {
            switch (locale) {
              case 'de-DE': return <Readme_de_DE />
              default: return <Readme_en_EN />
            }
          })()}
        </Suspense>
      </Container>
    </Drawer>
  )
}
