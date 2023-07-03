import { MutableRefObject } from "react";
import { useCurrentState } from "./useCurrentState";



export type InputHook<T> = {
    state: T;
    setState: (val: T | ((prev: T) => T)) => void;
    currentRef: MutableRefObject<T>;
    reset: () => void;
    bindings: {
        value: T;
        checked: boolean;
        onChange: (event: any) => void;
    };
}

export function useInput<T>(initialValue: T): InputHook<T> {
    const [state, setState, currentRef] = useCurrentState(initialValue)
    const reset = () => setState(initialValue);
    const onChange = (event: any) => {
        if (typeof event === "object" && "target" in event) {
            if (!(event.target instanceof Node) && "checked" in event.target) {
                setState(event.target.checked);
            } else if ("value" in event.target) {
                setState(event.target.value);
            } else {
                console.error("Don't know how to set state from ", event.target)
                throw new Error("Don't know how to set state from " + event.target)
            }
        } else {
            setState(event)
        }
    }
    return {
        state,
        setState,
        currentRef,
        reset,
        bindings: {
            value: state, checked: !!state, onChange
        }
    };
};