import { SVGAttributes } from "react";
import { OIDCodePattern } from "./OIDCodePattern";

export type OIDCodeProps = {
  width: number;
  height: number;
  code: number;
  oidCodePixelSize: number;
} & ({ dpmm: number } | { dpi: number });

export function OIDCode({
  code,
  width,
  height,
  oidCodePixelSize,
  ...props
}: OIDCodeProps & SVGAttributes<SVGSVGElement>) {
  const id = `pattern.${code}`;
  const dpmm = "dpi" in props ? props.dpi / 25.4 : props.dpmm;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width * dpmm} ${height * dpmm}`}
      {...props}
    >
      <defs>
        <OIDCodePattern
          code={code}
          id={id}
          oidCodePixelSize={oidCodePixelSize}
        />
      </defs>
      <rect width={width * dpmm} height={height * dpmm} fill={`url(#${id})`} />
    </svg>
  );
}
