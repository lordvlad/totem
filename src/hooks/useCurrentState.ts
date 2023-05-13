import { useEffect, useRef, useState } from "preact/hooks";

export function useCurrentState<T>(initialState: T | (() => T)) {
    const [state, setState] = useState<T>(initialState)

    const ref = useRef<T>(state);

    useEffect(() => { ref.current = state }, [state]);

    const setValue = (update: T | ((prev: T) => T)) => {
        ref.current = typeof update === 'function' ? (update as Function)(ref.current) : update;
        setState(ref.current);
    };

    return [state, setValue, ref] as const;
};