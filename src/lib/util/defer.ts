export type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
}

export function deferred<T>() {
    let resolve: undefined | ((value: T | PromiseLike<T>) => void);
    let reject: undefined | ((reason?: any) => void);

    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })

    return { promise, reject, resolve } as Deferred<T>
}