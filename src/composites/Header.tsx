import { Box, Button, Flex, Space, Text } from "@mantine/core";
import { useGlobalState } from "../hooks/useGlobalState";
import { useI18n } from "../i18n/i18n";
import { LocalePicker } from "./LocalePicker";
import { ThemePicker } from "./ThemePicker";
import Feather from "../icons/Feather";
import HelpCircle from "../icons/HelpCircle";


export function Header() {
    const i18n = useI18n()
    const setShowHelp = useGlobalState("help", false)[1]

    return (
        <Flex>
            <h1>
                <Feather />
                <Space w="md" sx={{ display: "inline-block" }} />
                Totem
                <Space w="md" sx={{ display: "inline-block" }} />
                <Text component="span" fz={"md"}>{i18n`your music on your tiptoi`}</Text>
            </h1>
            <Box sx={{ flexGrow: 1 }} />
            <Flex gap="sm" pt="sm">
                <Button variant="outline" rightIcon={<HelpCircle />} onClick={() => setShowHelp(true)}>{i18n`Help`}</Button>
                <LocalePicker />
                <ThemePicker />
            </Flex>
        </Flex>
    )
}