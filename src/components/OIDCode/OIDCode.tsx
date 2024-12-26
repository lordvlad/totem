import { SVGAttributes } from 'react'
import { renderToString } from 'react-dom/server'

/**
 * translated using chatgpt from https://github.com/entropia/tip-toi-reveng/blob/master/src/OidCode.hs#L30
 */
function checksum (code: number): number {
  const c1 = (((code >> 2) ^ (code >> 8) ^ (code >> 12) ^ (code >> 14)) & 0x01) << 1
  const c2 = c1 | (((code) ^ (code >> 4) ^ (code >> 6) ^ (code >> 10)) & 0x01)
  return c2 ^ 0x02
}

function assertNotUndefined<X> (x: X, msg: string) {
  if (typeof x === 'undefined') throw new Error(msg)
  return x
}

function cartesianProduct<T, S> (a: Iterable<T>, b: Iterable<S>) {
  const ai = a[Symbol.iterator]()
  return (function * () {
    let an = ai.next()
    while (!an.done) {
      const bi = b[Symbol.iterator]()
      let bn = bi.next()
      while (!bn.done) {
        yield [an.value, bn.value] as const
        bn = bi.next()
      }
      an = ai.next()
    }
  }())
}

export function range (end: number): number[]
export function range (start: number, end: number): number[]
export function range (startOrEnd: number, end?: number) {
  let start = typeof end === 'undefined' ? 0 : startOrEnd
  const end1 = typeof end === 'undefined' ? startOrEnd : end
  return Array.from(function * () { while (start <= end1) yield start++ }())
}

function zip<T, S> (a: Iterable<T>, b: Iterable<S>) {
  const [ai, bi] = [a[Symbol.iterator](), b[Symbol.iterator]()]
  return (function * () {
    let [an, bn] = [ai.next(), bi.next()] as const
    while (!an.done && !bn.done) {
      yield [an.value, bn.value] as const
      [an, bn] = [ai.next(), bi.next()]
      if (an.done !== bn.done) throw new Error('Iterables have different lengths')
    }
  }())
}

interface PxArgs { x: number, y: number, size: number }

type Px = (arg: PxArgs) => JSX.Element

function Pixel ({ x, y, size }: PxArgs) {
  return <path d={`M ${x + size * 2 + 1},${y + size * 2 + 1} h${size} v${size} h-${size} z`} />
}

function at ({ x = 0, y = 0 }: Partial<Pick<PxArgs, 'x' | 'y'>>, F: Px) {
  return ({ x: x1, y: y1, size }: PxArgs) => <F x={x + x1} y={y + y1} size={size} />
}

const Special = at({ x: 3 }, Pixel)

function shift (n: number, size: number) {
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

export function OIDCodePattern ({ id, code, oidCodePixelSize }: { id: string, code: number, oidCodePixelSize: number }) {
  const quart = (n: number) => n === 8 ? checksum(code) : Math.floor((code / (4 ** n)) % 4)
  const data = zip(cartesianProduct([3, 2, 1], [3, 2, 1]), range(8).map(quart).map(shift))
  return (
    <pattern id={id} width={48} height={48} patternUnits='userSpaceOnUse'>
      {[...data, ...frame].map(([[x, y], F]) => <F key={`${x}${y}`} x={x * 12} y={y * 12} size={oidCodePixelSize} />)}
    </pattern>
  )
}

export type OIDCodeProps = {
  width: number
  height: number
  code: number
  oidCodePixelSize: number
} & ({ dpmm: number } | { dpi: number })

export function oidCodeDataUrl (props: OIDCodeProps & SVGAttributes<SVGSVGElement>) {
  const xml = renderToString(<OIDCode {...props} />)
  return `data:image/svg+xml;base64,${btoa(xml)}`
}

export function OIDCode ({ code, width, height, oidCodePixelSize, ...props }: OIDCodeProps & SVGAttributes<SVGSVGElement>) {
  const id = `pattern.${code}`
  const dpmm = 'dpi' in props ? props.dpi / 25.4 : props.dpmm

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={width}
      height={height}
      viewBox={`0 0 ${width * dpmm} ${height * dpmm}`}
      {...props}
    >
      <defs>
        <OIDCodePattern code={code} id={id} oidCodePixelSize={oidCodePixelSize} />
      </defs>
      <rect width={width * dpmm} height={height * dpmm} fill={`url(#${id})`} />
    </svg>
  )
}
