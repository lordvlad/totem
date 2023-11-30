import { Box, Button, Flex, Space, Text, em } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import Feather from "../components/icons/Feather";
import HelpCircle from "../components/icons/HelpCircle";
import { useHelpPanel } from "../stores/help";
import { useI18n } from "../util/i18n/i18n";
import { LocalePicker } from "./LocalePicker";
import { ThemePicker } from "./ThemePicker";

export function Header() {
    const i18n = useI18n()
    const setShowHelp = useHelpPanel()[1]
    const isMobile = useMediaQuery(`(max-width: ${em(750)})`);

    const title = (
        <h1>
            <Feather />
            <Space w="md" style={{ display: "inline-block" }} />
            Totem
            <Space w="md" style={{ display: "inline-block" }} />
            <Text component="span" fz={"md"}>{i18n`your music on your tiptoi`}</Text>
        </h1>
    )

    const menu = (
        <Flex gap="sm" pt="sm">
            <Button variant="outline" rightSection={<HelpCircle />} onClick={() => setShowHelp(true)}>{i18n`Help`}</Button>
            <LocalePicker />
            <ThemePicker />
        </Flex>
    )

    return isMobile
        ? (
            <Flex direction="column">
                {menu}
                {title}
            </Flex>
        ) : (
            <Flex>
                {title}
                <Box style={{ flexGrow: 1 }} />
                {menu}
            </Flex>
        )
}