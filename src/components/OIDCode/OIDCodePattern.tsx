import {
  assertNotUndefined,
  cartesianProduct,
  checksum,
  range,
  zip,
} from "./util";

interface PxArgs {
  x: number;
  y: number;
  size: number;
}

type Px = (arg: PxArgs) => JSX.Element;

function Pixel({ x, y, size }: PxArgs) {
  return (
    <path
      d={`M ${x + size * 2 + 1},${y + size * 2 + 1} h${size} v${size} h-${size} z`}
    />
  );
}

function at({ x = 0, y = 0 }: Partial<Pick<PxArgs, "x" | "y">>, F: Px) {
  return ({ x: x1, y: y1, size }: PxArgs) => (
    <F x={x + x1} y={y + y1} size={size} />
  );
}

const Special = at({ x: 3 }, Pixel);

function shift(n: number, size: number) {
  return assertNotUndefined(
    {
      0: at({ x: size, y: size }, Pixel),
      1: at({ x: -size, y: size }, Pixel),
      2: at({ x: -size, y: -size }, Pixel),
      3: at({ x: size, y: -size }, Pixel),
    }[n],
    `unexpected param ${n}`,
  );
}

type C = readonly [number, number];
const frame = [
  ...(
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [0, 1],
      [0, 3],
    ] as C[]
  ).map((n) => [n as C, Pixel] as const),
  ...[[[0, 2] as C, Special] as const],
];

export function OIDCodePattern({
  id,
  code,
  oidCodePixelSize,
}: {
  id: string;
  code: number;
  oidCodePixelSize: number;
}) {
  const quart = (n: number) =>
    n === 8 ? checksum(code) : Math.floor((code / 4 ** n) % 4);
  const data = zip(
    cartesianProduct([3, 2, 1], [3, 2, 1]),
    range(8).map(quart).map(shift),
  );
  return (
    <pattern id={id} width={48} height={48} patternUnits="userSpaceOnUse">
      {[...data, ...frame].map(([[x, y], F]) => (
        <F key={`${x}${y}`} x={x * 12} y={y * 12} size={oidCodePixelSize} />
      ))}
    </pattern>
  );
}
