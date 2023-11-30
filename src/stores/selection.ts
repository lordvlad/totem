import { Dispatch, SetStateAction, useState, useEffect, useCallback } from "react"


const state = {set: new Set<number>()}
const listeners = new Set<Dispatch<SetStateAction<Set<number>>>>()

export function _useSelection() {
    const [s, _setS] = useState(state.set)

    useEffect(() => {
        listeners.add(_setS)
        return () => { listeners.delete(_setS) }
    }, [])

    const setS: Dispatch<SetStateAction<Set<number>>> = useCallback((n: SetStateAction<Set<number>>) => {
        const v = state.set= typeof n === 'function' ? n(state.set) : n
        listeners.forEach(l => l(v))
    }, [])

    return [s, setS] as const
}

export function useSelection() {
    const [selected, setSelected] = _useSelection()
    const select = (...idx: number[]) => setSelected(prev => new Set([...prev, ...idx]))
    const unselect = (...idx: number[]) => {
        const idxSet = new Set(idx)
        setSelected(prev => new Set(Array.from(prev).filter(i => !idxSet.has(i))))
    }
    const toggle = (idx: number) => {
        setSelected(
            prev => prev.has(idx)
                ? new Set(Array.from(prev).filter(i => i !== idx))
                : new Set([...prev, idx]))
    }
    const reset = () => setSelected(new Set())

    return { selected, select, unselect, toggle, reset }
}


