import { Dispatch, SetStateAction, useState, useEffect, useCallback } from "react"

const state = { open: false }
const listeners = new Set<Dispatch<SetStateAction<boolean>>>()

export function useHelpPanel() {
    const [s, _setS] = useState(state.open)

    useEffect(() => {
        listeners.add(_setS)
        return () => { listeners.delete(_setS) }
    }, [])

    const setS: Dispatch<SetStateAction<boolean>> = useCallback((n: SetStateAction<boolean>) => {
        const v = state.open= typeof n === 'function' ? n(state.open) : n
        listeners.forEach(l => l(v))
    }, [])

    return [s, setS] as const
}