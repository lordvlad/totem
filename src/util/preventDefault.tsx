import { UIEvent } from 'react'

export function pd<E extends UIEvent> (f: (e: E) => void) {
  return function (e: E) {
    e.preventDefault()
    e.stopPropagation()
    f(e)
  }
}
