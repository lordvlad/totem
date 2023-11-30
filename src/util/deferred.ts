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
export class Deferred<T = any>  {
    readonly promise: Promise<T>;
    // @ts-ignore resolve _is_ initialized in constructor
    readonly resolve: (value: T | PromiseLike<T>) => void;
    // @ts-ignore reject _is_ initialized in constructor
    readonly reject: (reason?: any) => void;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            // @ts-ignore resolve _is_ initialized in constructor
            this.resolve = resolve;
            // @ts-ignore reject _is_ initialized in constructor
            this.reject = reject;
        })
    }
}

export function deferred<T = any>() {
    return new Deferred<T>();
}