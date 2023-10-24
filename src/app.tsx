import './app.css'

import { AppShell, AppShellProps, Box, Button, Container, Flex, Space } from '@mantine/core'

import { Header as AppHeader } from './composites/Header'
import { HelpPanel } from './composites/HelpPanel'
import { Menu } from './composites/Menu'
import { OptionsPanel } from './composites/OptionsPanel'
import { TracksPanel } from './composites/TracksPanel'
import { useI18n } from './i18n/i18n'
import Github from './icons/Github'
import AlertTriangle from './icons/AlertTriangle'

function AppFooter() {
  const i18n = useI18n()

  return (
    <Flex>
      <Button component="a" variant="subtle" target="_blank" href="http://github.com/lordvlad/totem" leftIcon={<Github />}>
        {i18n`Check it out on github`}
      </Button>
      <Button component="a" variant='subtle' target="_blank" href="https://github.com/lordvlad/totem/issues" leftIcon={<AlertTriangle />}>
        {i18n`File an issue`}
      </Button>
      <Box sx={{ flexGrow: 1 }} />
      {
        import.meta.env.VITE_GIT_HASH && (
          <Button component='a' variant='subtle' target="_blank" href={`https://github.com/lordvlad/totem/commit/${import.meta.env.VITE_GIT_HASH}`} >
            v{`${import.meta.env.VITE_GIT_HASH}`}
          </Button>
        )
      }
    </Flex>
  )
}

export function App(props: Omit<AppShellProps, 'children' | 'header' | 'footer' | 'aside' | 'navbar'>) {
  return (
    <AppShell className="no-print app-inner" {...props}>
      <Container>
        <HelpPanel />
        <OptionsPanel />

        <AppHeader />
        <Space h="xl" />
        <Menu />
        <Space h="sm" />
        <TracksPanel />
        <Space h="xl" />
        <AppFooter />
      </Container>
    </AppShell>
  )
}

