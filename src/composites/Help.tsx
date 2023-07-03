import { Container, Drawer } from '@mantine/core'

import { useGlobalState } from '../hooks/useGlobalState'
import { Readme } from './Readme'

export function Help() {
    const [showHelp, setShowHelp] = useGlobalState("help", false)

    return (
        <Drawer opened={showHelp} onClose={() => setShowHelp(false)} position="top" size="100%">
            <Container>
                <Readme />
            </Container>
        </Drawer>
    )
}
