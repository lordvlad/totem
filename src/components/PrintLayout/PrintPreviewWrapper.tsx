import { ActionIcon, Affix, Container, Drawer, em } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { iconStyle } from "../../util/constants";
import Eye from "../icons/Eye";
import { PrintPreview } from "./PrintPreview";

export function PrintPreviewWrapper() {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const [opened, { open, close }] = useDisclosure(false);

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
      <Drawer opened={opened} onClose={close} position="top" size="100%">
        <Container>
          <PrintPreview />
        </Container>
      </Drawer>
    </>
  );
}
