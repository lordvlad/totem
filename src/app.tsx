import './app.css'

import { Grid, Link, Page, PageProps, Spacer } from '@geist-ui/core'
import { Github } from '@geist-ui/icons'

import { Header } from './lib/composites/Header.js'
import { Help } from './lib/composites/Help'
import { Menu } from './lib/composites/Menu.js'
import { OptionsPanel } from './lib/composites/OptionsPanel'
import { Tracks } from './lib/composites/Tracks.js'

import { useI18n } from './lib/context/i18n/i18n.js'

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
        <Grid.Container>
          <Grid>
            <Github />
          </Grid>
          <Grid>
            <Link color href="http://lordvlad.github.com" icon>
              &nbsp;{i18n`Check me out on github`}
            </Link>
          </Grid>
        </Grid.Container>
      </Page.Footer>
    </Page >
  )
}

