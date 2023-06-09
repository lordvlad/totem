import { Button, Grid, Spacer, Text } from "@geist-ui/core";
import { Feather, HelpCircle } from "@geist-ui/icons";
import { useI18n } from "../i18n/i18n";
import { useGlobalState } from "../hooks/useGlobalState";
import { LocalePicker } from "./LocalePicker";
import { ThemePicker } from "./ThemePicker";


export function Header() {
    const i18n = useI18n()
    const setShowHelp = useGlobalState("help", false)[1]

    return (<Grid.Container gap={1} align="justify">
        <Grid xs>
            <h1>
                <Feather />
                <Spacer inline w={1} />
                Totem
                <Spacer inline w={1} />
                <Text span font={1}>{i18n`your music on your tiptoi`}</Text>
            </h1>
        </Grid>
        <Grid>
            <Grid.Container mt={1} gap={1}>
                <Grid>
                    <Button auto iconRight={<HelpCircle />} onClick={() => setShowHelp(true)}>{i18n`Help`}</Button>
                </Grid>
                <Grid>
                    <LocalePicker />
                </Grid>
                <Grid>
                    <ThemePicker />
                </Grid>
            </Grid.Container>
        </Grid>
    </Grid.Container>
    )
}