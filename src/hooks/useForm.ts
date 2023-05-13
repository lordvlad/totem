import { useEffect, useRef, useState } from "preact/hooks"
import { type InputHook, useInput } from "./useInput"
import { useLocalStorageState } from "./useLocalStorageState"

type Opts = {
    localStorageKey?: string
}

type NamedInputHook<T> = InputHook<T> & {
    bindings: InputHook<T>['bindings'] & {
        name: string
    }
}

export function useForm<T extends Record<string, any>>(initialValues: T, opts?: Opts) {
    const [localStorageState, setLocalStorageState] = useLocalStorageState(opts?.localStorageKey ?? null, initialValues)
    const form = useInput(localStorageState)
    const origEntries = Object.entries(initialValues)
    const firstFormUpdate = useRef(true)
    const hookEntries = origEntries.map(([name, val]) => {
        const input = useInput(val)
        const firstUpdate = useRef(true)
        useEffect(() => {
            if (firstUpdate.current) {
                firstUpdate.current = false
            } else {
                form.setState((prev => ({ ...prev, [name]: input.state })))
            }
        }, [input.state])
        return [name, { ...input, bindings: { ...input.bindings, name } }] as const
    })

    useEffect(() => {
        form.setState(localStorageState)
    }, [localStorageState])

    useEffect(() => {
        if (firstFormUpdate.current) {
            firstFormUpdate.current = false
        } else {
            hookEntries.forEach(([name, input]) => input.setState(form.state[name]))
            setLocalStorageState(form.state)
        }
    }, [form.state])

    return {
        state: form.state,
        reset: () => hookEntries.forEach(([_, input]) => input.reset()),
        ...Object.fromEntries(hookEntries) as {
            [P in keyof T]: NamedInputHook<T[P]>
        }
    }
}