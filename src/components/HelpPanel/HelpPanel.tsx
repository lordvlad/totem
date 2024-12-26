import { Center, Container, Drawer, Loader } from '@mantine/core'
import { Suspense, lazy } from 'react'
import { useHelpPanel } from './useHelpPanel'
import { useLocale } from '../../hooks/useI18n'

const Readme_en_EN = lazy(async () => await import('../../../README.md'))
const Readme_de_DE = lazy(async () => await import('../../../README.de_DE.md'))

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
