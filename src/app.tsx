import './app.css'

import { Grid, Link, Page, PageProps, Spacer } from '@geist-ui/core'
import { AlertTriangle, Github } from '@geist-ui/icons'

import { Header } from './composites/Header.js'
import { Help } from './composites/Help'
import { Menu } from './composites/Menu.js'
import { OptionsPanel } from './composites/OptionsPanel'
import { Tracks } from './composites/Tracks.js'

import { useI18n } from './i18n/i18n.js'

export function App(props: PageProps) {
  const i18n = useI18n()
  return (
    <Page {...props}>
      <Help />
      <OptionsPanel />
      <Page.Header>
        <Header />
      </Page.Header>

      <Page.Content>
        <Menu />
        <Spacer />
        <Tracks />
      </Page.Content>

      <Page.Footer>
        <Grid.Container gap={3}>
          <Grid>
            <Link target="_blank" color href="http://github.com/lordvlad/totem" icon className="with-icon">
              <Github />
              {i18n`Check it out on github`}
            </Link>
          </Grid>
          <Grid>
            <Link target="_blank" color href="https://github.com/lordvlad/totem/issues" icon className="with-icon">
              <AlertTriangle />
              {i18n`File an issue`}
            </Link>
          </Grid>
          {
            import.meta.env.VITE_GIT_HASH && (
              <>
                <Grid md></Grid>
                <Grid>
                  <Link target="_blank" color href={`https://github.com/lordvlad/totem/commit/${import.meta.env.VITE_GIT_HASH}`} icon>
                    v{`${import.meta.env.VITE_GIT_HASH}`}
                  </Link>
                </Grid>
              </>
            )
          }
        </Grid.Container>
      </Page.Footer>
    </Page >
  )
}

