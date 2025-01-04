/**
 * translated using chatgpt from https://github.com/entropia/tip-toi-reveng/blob/master/src/OidCode.hs#L30
 */
export function checksum(code: number): number {
  const c1 =
    (((code >> 2) ^ (code >> 8) ^ (code >> 12) ^ (code >> 14)) & 0x01) << 1;
  const c2 = c1 | ((code ^ (code >> 4) ^ (code >> 6) ^ (code >> 10)) & 0x01);
  return c2 ^ 0x02;
}

export function assertNotUndefined<X>(x: X, msg: string) {
  if (typeof x === "undefined") throw new Error(msg);
  return x;
}

export function cartesianProduct<T, S>(a: Iterable<T>, b: Iterable<S>) {
  const ai = a[Symbol.iterator]();
  return (function* () {
    let an = ai.next();
    while (!(an.done ?? false)) {
      const bi = b[Symbol.iterator]();
      let bn = bi.next();
      while (!(bn.done ?? false)) {
        yield [an.value, bn.value] as const;
        bn = bi.next();
      }
      an = ai.next();
    }
  })();
}

export function range(end: number): number[];
// eslint-disable-next-line @typescript-eslint/unified-signatures -- don't unify, cause the semantics are different
export function range(start: number, end: number): number[];
export function range(startOrEnd: number, end?: number) {
  let start = typeof end === "undefined" ? 0 : startOrEnd;
  const end1 = typeof end === "undefined" ? startOrEnd : end;
  return Array.from(
    (function* () {
      while (start <= end1) yield start++;
    })(),
  );
}

export function zip<T, S>(a: Iterable<T>, b: Iterable<S>) {
  const [ai, bi] = [a[Symbol.iterator](), b[Symbol.iterator]()];
  // eslint-disable-next-line complexity -- this is a simple function
  return (function* () {
    let [an, bn] = [ai.next(), bi.next()] as const;
    while (!(an.done ?? false) && !(bn.done ?? false)) {
      yield [an.value, bn.value] as const;
      [an, bn] = [ai.next(), bi.next()];
      if (an.done !== bn.done) {
        throw new Error("Iterables have different lengths");
      }
    }
  })();
}
