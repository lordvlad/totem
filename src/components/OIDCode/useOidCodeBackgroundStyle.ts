import { useMemo } from "react";
import { useOidCodeBackgroundImage } from "./useOidCodeBackgroundImage";

export function useOidCodeBackgroundStyle({ code }: { code: number }) {
  const backgroundImage = useOidCodeBackgroundImage({ code });
  return useMemo(
    () => ({
      zIndex: 999,
      position: "absolute" as const,
      bottom: 0,
      right: 0,
      left: 0,
      top: 0,
      backgroundImage: `url(${backgroundImage})`,
      pointerEvents: "none" as const,
    }),
    [backgroundImage],
  );
}
