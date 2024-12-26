import { useMemo } from "react"
import { useBackgroundImage } from "./useOidCodeBackgroundImage"

export function useBackgroundStyle({ code }: { code: number }) {
  const backgroundImage = useBackgroundImage({ code })
  return useMemo(() => ({
    zIndex: 999,
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
    backgroundImage: `url(${backgroundImage})`
  }), [backgroundImage])
}
