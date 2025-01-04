import { useMantineColorScheme } from "@mantine/core";
import { useMemo } from "react";
import { oidCodeDataUrl } from ".";
import { useOptions } from "../../hooks/useOptions";

export function useOidCodeBackgroundImage({
  code,
  width = 32,
  height = 32,
}: {
  code: number;
  width?: number;
  height?: number;
}) {
  const { colorScheme } = useMantineColorScheme();
  const fill = colorScheme === "dark" ? "white" : "black";
  const { oidCodePixelSize, oidCodeResolution } = useOptions()[0];

  const dpmm = oidCodeResolution * 0.039370079;

  return useMemo(
    () =>
      oidCodeDataUrl({
        width,
        height,
        dpmm,
        code,
        fill,
        dpi: oidCodeResolution,
        oidCodePixelSize,
      }),
    [dpmm, code, fill, oidCodeResolution, oidCodePixelSize],
  );
}
