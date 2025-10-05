import { Box } from "@mantine/core";
import { TestPrintLayout } from "./TestPrintLayout";
import { useTestPrintMode } from "../../hooks/useTestPrintMode";

export function TestPrintLayoutWrapper() {
  const { active } = useTestPrintMode();

  if (!active) {
    return null;
  }

  return (
    <Box className="test-print-only">
      <TestPrintLayout />
    </Box>
  );
}
