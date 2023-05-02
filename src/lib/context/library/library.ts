import { useState as preactUseState, useEffect } from 'preact/hooks';
import { type Mp3WebWorkerRequest, type Mp3WebWorkerResponse } from './decoder';
import { distinct } from '../../util/distinct';
import { delMany, getMany, keys, setMany } from 'idb-keyval';
import { Track } from '../../data/track';
import { hydrate } from '../../util/hydrate';

const worker = new Worker(new URL('./decoder.worker.ts', import.meta.url), { type: 'module' })

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
    | { event: "init" }
    | { event: "initialized", tracks: Track[] }
    | { event: "clear" }
    | { event: "cleared" }
    | { event: "update", tracks: Track[] }
    | { event: "updated", tracks: Track[] }
    | { event: "remove", tracks: Track[] }
    | { event: "removed", tracks: Track[] }

const distinctByName = distinct("fileName")

async function onDrop(items: DataTransferItem[]) {
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

function remove(...tracks: Track[]) {
    dispatch({ event: "remove", tracks })
}

function clear() {
    dispatch({ event: "clear" })
}

function load(handles: FileSystemFileHandle[]) {
    dispatch({ event: "load", handles })
}

function update(...tracks: Track[]) {
    dispatch({ event: "update", tracks })
}

function reduce(s: typeof state, action: A): S {
    switch (action.event) {
        case "load":
            worker.postMessage({ event: 'load', handles: action.handles })
            return { ...s, isLoading: true }
        case "loaded":
            return {
                ...s,
                isLoading: action.n !== action.total - 1,
                tracks: distinctByName([...s.tracks, hydrate(action.meta, Track)])
            }
        case "error":
            console.error(action)
            return s
        case "debug":
            console.log(action)
            return s
        case "remove":
            delMany(action.tracks.map(t => `track:${t.fileName}`))
                .then(() => dispatch({ event: "removed", tracks: action.tracks }))
                .catch(e1 => console.error(e1))
            return { ...s, isLoading: true }
        case "removed":
            const removed = new Set(action.tracks.map(t => t.fileName))
            return { ...s, isLoading: false, tracks: s.tracks.filter(t => !removed.has(t.fileName)) }
        case "clear":
            delMany(s.tracks.map(t => `track:${t.fileName}`))
                .then(() => dispatch({ event: "cleared" }))
                .catch(e1 => console.error(e1))
            return { ...s, isLoading: true }
        case "cleared":
            return { ...s, isLoading: false, tracks: [] }
        case "init":
            keys()
                .then(ks => getMany(ks.filter(k => typeof k === "string" && k.startsWith("track"))))
                .then(items => items.map(item => hydrate(item, Track)))
                .then(tracks => dispatch({ event: "initialized", tracks }))
                .catch(e1 => console.error(e1))
            return { ...s, isLoading: true, tracks: [] }
        case "initialized":
            return { ...s, isLoading: false, tracks: action.tracks }
        case "update":
            setMany(action.tracks.map(track => [`track:${track.fileName}`, track]))
                .then(() => dispatch({ event: "updated", tracks: action.tracks }))
                .catch(e1 => console.error(e1))
            return { ...s, isLoading: true }
        case "updated":
            return { ...s, isLoading: false }

        default: throw new Error(`Unhandled action ${JSON.stringify(action)}`)
    }
}


worker.addEventListener("error", e => console.error(e, JSON.stringify(e), e.message))
worker.addEventListener("messageerror", e => console.error(e))
worker.addEventListener("message", ({ data }) => dispatch(data))

export function dispatch(action: A) {
    let i = 0;
    const prevValues = Array.from(listeners, ([getValue]) => getValue(state));
    state = reduce(state, action);
    listeners.forEach((setValue, getValue) => {
        const value = getValue(state);
        if (value !== prevValues[i++]) setValue(value);
    });
}

export function useLibrary<T>(getValue: ((s: S) => T)) {
    const [value, setValue] = preactUseState(getValue(state));

    useEffect(() => {
        listeners.set(getValue, setValue);
        return () => listeners.delete(getValue);
    }, [getValue]);
    return {
        ...value,
        dispatch,
        remove,
        onDrop,
        clear,
        load,
        update,
    };
}

dispatch({ event: "init" })
