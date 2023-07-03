import './app.css'

import { AppShell, AppShellProps, Box, Button, Container, Flex, Header, Space } from '@mantine/core'

import { Header as AppHeader } from './composites/Header'
import { Help } from './composites/Help'
import { Menu } from './composites/Menu'
import { OptionsPanel } from './composites/OptionsPanel'
import { Tracks } from './composites/Tracks'
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
    <AppShell
      header={<Header withBorder={false} bg={"transparent"} height="93" ><Container><AppHeader /></Container></Header>}
      {...props}>
      <Container>
        <Help />
        <OptionsPanel />
        <Menu />
        <Space h="sm" />
        <Tracks />
        <Space h="xl" />
        <AppFooter />
      </Container>
    </AppShell>
  )
}

