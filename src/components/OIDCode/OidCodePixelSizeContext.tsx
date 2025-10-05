import { createContext, useContext } from "react";

export const OidCodePixelSizeContext = createContext<number | null>(null);

export function useOidCodePixelSizeContext() {
  return useContext(OidCodePixelSizeContext);
}
