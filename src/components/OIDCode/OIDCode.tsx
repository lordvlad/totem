import { JSX } from "preact/jsx-runtime";
import { useOptions } from "../../library/options";

/**
 * translated using chatgpt from https://github.com/entropia/tip-toi-reveng/blob/master/src/OidCode.hs#L30
 */
function checksum(code: number): number {
    const c1 = (((code >> 2) ^ (code >> 8) ^ (code >> 12) ^ (code >> 14)) & 0x01) << 1;
    const c2 = c1 | (((code) ^ (code >> 4) ^ (code >> 6) ^ (code >> 10)) & 0x01);
    return c2 ^ 0x02;
}

function assertNotUndefined<X>(x: X, msg: string) {
    if (typeof x === "undefined") throw new Error(msg)
    return x;
}

function cartesianProduct<T, S>(a: Iterable<T>, b: Iterable<S>) {
    const ai = a[Symbol.iterator]();
    return function* () {
        let an = ai.next()
        while (!an.done) {
            let bi = b[Symbol.iterator]();
            let bn = bi.next()
            while (!bn.done) {
                yield [an.value, bn.value] as const
                bn = bi.next()
            }
            an = ai.next()
        }
    }()
}

export function range(end: number): number[];
export function range(start: number, end: number): number[];
export function range(startOrEnd: number, end?: number) {
    let start = typeof end === "undefined" ? 0 : startOrEnd;
    const end1 = typeof end === "undefined" ? startOrEnd : end;
    return Array.from(function* () { while (start <= end1) yield start++ }())
}

function zip<T, S>(a: Iterable<T>, b: Iterable<S>) {
    const [ai, bi] = [a[Symbol.iterator](), b[Symbol.iterator]()];
    return function* () {
        let [an, bn] = [ai.next(), bi.next()] as const
        while (!an.done && !bn.done) {
            yield [an.value, bn.value] as const
            [an, bn] = [ai.next(), bi.next()]
            if (an.done !== bn.done) throw new Error("Iterables have different lengths")
        }
    }()
}

type Coords = { x: number; y: number }

type Px = (arg: Coords) => JSX.Element;

function Pixel({ x, y }: Coords) {
    const size = useOptions()[0].oidPixelSize
    return <path d={`M ${x + size * 2 + 1},${y + size * 2 + 1} h${size} v${size} h-${size} z`} />
}

function at({ x = 0, y = 0 }: Partial<Coords>, F: Px) {
    return ({ x: x1, y: y1 }: Coords) => <F x={x + x1} y={y + y1} />
}

const Special = at({ x: 3 }, Pixel)

function shift(n: number) {
    const size = useOptions()[0].oidPixelSize
    return assertNotUndefined(({
        0: at({ x: size, y: size }, Pixel),
        1: at({ x: -size, y: size }, Pixel),
        2: at({ x: -size, y: -size }, Pixel),
        3: at({ x: size, y: -size }, Pixel)
    })[n], `unexpected param ${n}`)
}


type C = readonly [number, number]
const frame = [
    ...(([[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [0, 3]] as C[]).map(n => [n as C, Pixel] as const)),
    ...([[[0, 2] as C, Special] as const])
]

export function OIDCodePattern({ id, code }: { id: string; code: number }) {
    const quart = (n: number) => n === 8 ? checksum(code) : Math.floor((code / (4 ** n)) % 4)
    const data = zip(cartesianProduct([3, 2, 1], [3, 2, 1]), range(8).map(quart).map(shift))
    return (
        <pattern id={id} width={48} height={48} patternUnits="userSpaceOnUse" >
            {[...data, ...frame].map(([[x, y], F]) => <F x={x * 12} y={y * 12} />)}
        </pattern >
    )
}

export type OIDCodeProps = {
    width: number;
    height: number;
    code: number;
}

export function OIDCode({ code, width, height, ...props }: OIDCodeProps & JSX.SVGAttributes<SVGSVGElement>) {
    // convert dpi to dpmm
    const dpmm = useOptions()[0].oidCodeResolution * 0.039370079

    const id = `pattern.${code}`

    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox={`0 0 ${width * dpmm} ${height * dpmm}`}
            {...props} >
            <defs>
                <OIDCodePattern code={code} id={id} />
            </defs>
            <rect width={width * dpmm} height={height * dpmm} fill={`url(#${id})`} />
        </svg>
    )
}