import { Dispatch, SetStateAction, useEffect, useState } from "react";

const store: Record<string, unknown> = {}
const listeners: Record<string, Dispatch<SetStateAction<any>>[]> = {};

(window as any).globalState = { store, listeners };

export function useGlobalState<S>(key: string | null, initialValue: S | (() => S)) {
    const initialValue1 = (() => {
        if (key !== null && key in store) return store[key] as S
        const val = (typeof initialValue === 'function')
            ? (initialValue as (() => S))()
            : initialValue;
        if (key !== null) store[key] = val
        return val
    })();

    const [state, _setState] = useState(initialValue1)

    const setState = key === null ? _setState : ((update: Parameters<Dispatch<SetStateAction<S>>>[0]) => {
        const current = store[key] as S
        const next = typeof update === 'function' ? (update as Function)(current) : update
        store[key] = next
        listeners[key].forEach(l => l(next));
    }) as Dispatch<SetStateAction<S>>;

    useEffect(() => {
        if (key !== null) {
            if (!(key in listeners)) listeners[key] = []
            listeners[key].push(_setState)
            return () => {
                listeners[key] = listeners[key].filter(l => l !== _setState)
            }
        }
    }, [key])

    return [state, setState] as const
}
