import { Button, Drawer, Grid, Page } from '@geist-ui/core'
import { X } from '@geist-ui/icons'

import { useI18n } from '../context/i18n/i18n.js'

import { useGlobalState } from '../hooks/useGlobalState.js'
import { Readme } from './Readme.js'

export function Help() {
    const i18n = useI18n()
    const [showHelp, setShowHelp] = useGlobalState("help", false)

    return (
        <Drawer visible={showHelp} onClose={() => setShowHelp(false)} placement="top">
            <Drawer.Content>
                <Grid.Container>
                    <Grid xs />
                    <Grid >
                        <Button onClick={() => setShowHelp(false)} auto iconRight={<X />}>{i18n`Close`}</Button>
                    </Grid>
                </Grid.Container>
                <Page>
                    <Readme />
                </Page>
            </Drawer.Content>
        </Drawer>
    )
}
