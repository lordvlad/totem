import { PropsWithChildren, useState } from "react";
import { useGmePlayer } from "../../hooks/useGmePlayer";
import { Box } from "@mantine/core";
import { useOidCodeBackgroundStyle } from ".";

export type OIDCodeBoxProps = PropsWithChildren<{ code: number }>;

const cursorXml = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" transform="scale(1, -1)"><path fill="orange" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
 `;

const cursorStyle = {
  cursor: `url(data:image/svg+xml;base64,${btoa(cursorXml)}), auto`,
};

const hoverStyle = {
  boxShadow: "0 0 5px 2px rgba(255, 0, 0, 0.5)",
};

export function OIDCodeBox({ code, children }: OIDCodeBoxProps) {
  const touch = useGmePlayer();
  const [hover, setHover] = useState(false);
  return (
    <Box pos={"relative"} display={"inline-block"}>
      <Box
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => touch(code)}
        style={{
          ...cursorStyle,
          ...useOidCodeBackgroundStyle({ code }),
          ...(hover ? hoverStyle : {}),
        }}
      />
      {children}
    </Box>
  );
}
