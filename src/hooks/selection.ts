import { proxy, useSnapshot } from 'valtio'

export const stateProxy = proxy({ set: new Set<number>() })

export function select(...idx: number[]) {
  stateProxy.set = new Set([...stateProxy.set, ...idx])
}

export function unselect(...idx: number[]) {
  const idxSet = new Set(idx)
  stateProxy.set = new Set(Array.from(stateProxy.set).filter(i => !idxSet.has(i)))
}

export function toggle(idx: number) {
  stateProxy.set = stateProxy.set.has(idx)
    ? new Set(Array.from(stateProxy.set).filter(i => i !== idx))
    : new Set([...stateProxy.set, idx])
}

export function reset() {
  stateProxy.set = new Set()
}

export function useSelection() {
  const selected = useSnapshot(stateProxy).set
  return { selected, select, unselect, toggle, reset }
}
