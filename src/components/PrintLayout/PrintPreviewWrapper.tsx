import { ActionIcon, Affix, Box, em } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { iconStyle } from "../../util/constants";
import Eye from "../icons/Eye";
import { PrintPreview } from "./PrintPreview";

export function PrintPreviewWrapper() {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const [opened, { toggle }] = useDisclosure(false);

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
          onClick={toggle}
          aria-label="Toggle print preview"
        >
          <Eye {...iconStyle} />
        </ActionIcon>
      </Affix>
      {opened && (
        <Box
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflow: "auto",
          }}
          onClick={toggle}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <PrintPreview />
          </Box>
        </Box>
      )}
    </>
  );
}
