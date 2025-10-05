import { ActionIcon, Affix, Container, Drawer, em } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useI18n } from "../../hooks/useI18n";
import { iconStyle } from "../../util/constants";
import Eye from "../icons/Eye";
import { PrintPreview } from "./PrintPreview";

export function PrintPreviewWrapper() {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const [opened, { open, close }] = useDisclosure(false);
  const i18n = useI18n();

  if (!isMobile) {
    return <PrintPreview />;
  }

  return (
    <>
      <Affix position={{ bottom: 20, right: 20 }}>
        <ActionIcon
          size="xl"
          radius="xl"
          variant="filled"
          onClick={open}
          aria-label="Toggle print preview"
        >
          <Eye {...iconStyle} />
        </ActionIcon>
      </Affix>
      <Drawer
        opened={opened}
        onClose={close}
        position="top"
        size="100%"
        title={i18n`Print Preview`}
        closeButtonProps={{ "aria-label": i18n`Close` }}
      >
        <Container>
          <PrintPreview />
        </Container>
      </Drawer>
    </>
  );
}
