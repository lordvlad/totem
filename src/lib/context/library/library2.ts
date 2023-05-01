import { useState as preactUseState, useEffect } from 'preact/hooks';
import { type Mp3WebWorkerRequest, type Mp3WebWorkerResponse } from './decoder';
import TracksWorker from './decoder.worker?sharedworker'
import { distinct } from '../../util/distinct';
import { delMany } from 'idb-keyval';
import { Track } from '../../data/track';
import { hydrate } from '../../util/hydrate';

const worker = new TracksWorker()

const listeners = new Map();

let state = {
    isLoading: false,
    tracks: [] as Track[],
    error: null as null | Error,

};

type S = typeof state
type A =
    | Mp3WebWorkerRequest
    | Mp3WebWorkerResponse
    | { event: "clear" }
    | { event: "cleared" }
    | { event: "remove", tracks: Track[] }
    | { event: "removed", tracks: Track[] }

const distinctByName = distinct("fileName")

function reduce(s: typeof state, action: A): S {
    switch (action.event) {
        case "load":
            worker.port.postMessage({ event: 'load', handles: action.handles })
            return {
                ...state,
                isLoading: true
            }
        case "loaded":
            return {
                ...state,
                isLoading: action.n !== action.total,
                tracks: distinctByName([...state.tracks, hydrate(action.meta, Track)])
            }
        case "error":
            console.error(action)
            return state
        case "debug":
            console.log(action)
            return state
        case "remove":
            delMany(action.tracks.map(t => `track:${t.fileName}`))
                .then(() => dispatch({ event: "removed", tracks: action.tracks }))
                .catch(e1 => console.error(e1))
            return { ...state, isLoading: true }
        case "removed":
            const removed = new Set(action.tracks.map(t => t.fileName))
            return { ...state, isLoading: false, tracks: state.tracks.filter(t => removed.has(t.fileName)) }
        case "clear":
            delMany(state.tracks.map(t => `track:${t.fileName}`)).catch(e1 => console.error(e1))
            return { ...state, isLoading: true }
        case "cleared":
            return { ...state, isLoading: false, tracks: [] }
        default: throw new Error(`Unhandled action ${JSON.stringify(action)}`)
    }
}

worker.addEventListener("error", e => console.error(e))
worker.port.addEventListener("messageerror", e => console.error(e))
worker.port.addEventListener("message", ({ data }) => dispatch(data))

export function dispatch(action: A) {
    let i = 0;
    const prevValues = Array.from(listeners, ([getValue]) => getValue(state));
    state = reduce(state, action);
    listeners.forEach((setValue, getValue) => {
        const value = getValue(state);
        if (value !== prevValues[i++]) setValue(value);
    });
}

export function useState<T>(getValue: ((s: S) => T) = x => (x as T)) {
    const [value, setValue] = preactUseState(getValue(state));

    useEffect(() => {
        listeners.set(getValue, setValue);
        return () => listeners.delete(getValue);
    }, [getValue]);
    return value;
}

export function useDropHandler() {

    return async function onDrop(items: DataTransferItem[]) {
        const handlePromises = items.map(async item => {
            if (item.kind === 'file') {
                // FIXME fix this any; this is an experimental API 
                const handle = await ((item as any).getAsFileSystemHandle() as Promise<FileSystemHandle>)
                if (handle.kind === 'file') return handle as FileSystemFileHandle
            }
            console.error("Item dropped is not a file", item)
            return null
        })

        const handles = (await Promise.all(handlePromises)).filter(Boolean) as FileSystemFileHandle[]

        dispatch({ event: "load", handles })
    }
}