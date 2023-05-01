import { useGlobalState } from "../hooks/useGlobalState";

export function useSelection() {
    const [selected, setSelected] = useGlobalState<Set<number>>('selection', new Set())
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