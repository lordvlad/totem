import { Flex, Button, Box } from "@mantine/core";
import AlertTriangle from "../icons/AlertTriangle";
import Github from "../icons/Github";
import { useI18n } from "../../hooks/useI18n/useI18n";
import { iconStyle } from "../../util/constants";

export function AppFooter() {
  const i18n = useI18n();

  return (
    <Flex>
      <Button
        component="a"
        variant="subtle"
        target="_blank"
        href="http://github.com/lordvlad/totem"
        leftSection={<Github {...iconStyle} />}
      >
        {i18n`Check it out on Github`}
      </Button>
      <Button
        component="a"
        variant="subtle"
        target="_blank"
        href="https://github.com/lordvlad/totem/issues"
        leftSection={<AlertTriangle {...iconStyle} />}
      >
        {i18n`File an issue`}
      </Button>
      <Box style={{ flexGrow: 1 }} />
      {import.meta.env.VITE_GIT_HASH && (
        <Button
          component="a"
          variant="subtle"
          target="_blank"
          href={`https://github.com/lordvlad/totem/commit/${import.meta.env.VITE_GIT_HASH}`}
        >
          v{`${import.meta.env.VITE_GIT_HASH}`}
        </Button>
      )}
    </Flex>
  );
}
