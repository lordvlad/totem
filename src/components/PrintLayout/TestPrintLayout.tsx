import { Box, Text, Stack, SimpleGrid } from "@mantine/core";
import { OIDCode } from "../OIDCode/OIDCode";
import { useOptions } from "../../hooks/useOptions";
import { useI18n } from "../../hooks/useI18n";
import { range } from "../OIDCode/util";

const TEST_PRODUCT_ID = 950;
const PIXEL_SIZES = range(3, 12);

function TestOidCode({ pixelSize }: { pixelSize: number }) {
  const { oidCodeResolution } = useOptions()[0];

  const powerOnCode = TEST_PRODUCT_ID * 0x10000;

  return (
    <Box
      style={{
        border: "1px solid #ccc",
        padding: "16px",
        textAlign: "center",
        breakInside: "avoid",
      }}
    >
      <Text fw={700} mb="sm">
        Pixel Size: {pixelSize}px
      </Text>
      <Box
        style={{
          margin: "0 auto",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <OIDCode
          code={powerOnCode}
          width={48}
          height={48}
          dpi={oidCodeResolution}
          oidCodePixelSize={pixelSize}
        />
      </Box>
      <Text size="sm" mt="xs" c="dimmed">
        Power-On Code
      </Text>
    </Box>
  );
}

export function TestPrintLayout() {
  const i18n = useI18n();

  return (
    <Box p="md">
      <Stack gap="md">
        <Box>
          <Text size="xl" fw={700} mb="xs">
            {i18n`OID Pixel Size Test Page`}
          </Text>
          <Text size="sm" c="dimmed">
            {i18n`Product ID:`} {TEST_PRODUCT_ID}
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            {i18n`Print this page and use the test GME file to find the optimal pixel size for your printer.`}
          </Text>
        </Box>

        <SimpleGrid cols={3} spacing="md">
          {PIXEL_SIZES.map((size) => (
            <TestOidCode key={size} pixelSize={size} />
          ))}
        </SimpleGrid>

        <Box mt="md">
          <Text size="sm" fw={500} mb="xs">
            {i18n`Instructions:`}
          </Text>
          <ol style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
            <li>{i18n`Download and copy the test GME file to your tiptoi pen`}</li>
            <li>{i18n`Print this page at 100% scale (no scaling)`}</li>
            <li>{i18n`Touch each code with your tiptoi pen`}</li>
            <li>{i18n`Note which pixel size works best (pen successfully recognizes the code)`}</li>
            <li>{i18n`Update the OID Pixel Size setting in the Options panel accordingly`}</li>
          </ol>
        </Box>
      </Stack>
    </Box>
  );
}
