import { useEffect } from "react";
import { useGlobalState } from "./useGlobalState";

export function useLocalStorageState<T>(key: string | null, initialValue: T | (() => T)) {
    const [state, setState] = useGlobalState(key, initialValue)

    useEffect(() => {
        if (key !== null) {
            const val = localStorage.getItem(key)
            if (val !== null) setState(JSON.parse(val))
        }
    }, [])

    const setAndSaveState = (newState: T | ((prev: T) => T)) => {
        if (key !== null) localStorage.setItem(key, JSON.stringify(newState))
        setState(newState)
    }

    return [state, setAndSaveState] as const
}