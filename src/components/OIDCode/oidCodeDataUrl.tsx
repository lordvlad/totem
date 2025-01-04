import { SVGAttributes } from "react";
import { OIDCode, type OIDCodeProps } from "./OIDCode";
import { renderToString } from "react-dom/server";

export function oidCodeDataUrl(
  props: OIDCodeProps & SVGAttributes<SVGSVGElement>,
) {
  const xml = renderToString(<OIDCode {...props} />);
  return `data:image/svg+xml;base64,${btoa(xml)}`;
}
