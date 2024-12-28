/**
 * Create an promise, and return also the resolve and reject methods to the caller,
 * so they can pass them as they see fit
 *
 * @example
 *     const {resolve,reject,promise}=deferred<string>()
 *     emitter.on("done", ()=>resolve("ok"))
 *     emitter.on("error", (e)=>reject(e))
 *     return promise
 * @returns a Deferred
 */
export class Deferred<T> {
  readonly promise: Promise<T>;
  // @ts-expect-error resolve _is_ initialized in constructor
  readonly resolve: (value: T | PromiseLike<T>) => void;
  // @ts-expect-error reject _is_ initialized in constructor
  readonly reject: (reason?: unknown) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      // @ts-expect-error resolve _is_ initialized in constructor
      this.resolve = resolve;
      // @ts-expect-error reject _is_ initialized in constructor
      this.reject = reject;
    });
  }
}

export function deferred<T = void>() {
  return new Deferred<T>();
}
