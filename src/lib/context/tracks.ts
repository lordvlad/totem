import { useCallback ,useState} from "preact/hooks"
import { useGlobalState } from "../hooks/useGlobalState"
import { ID3 } from "../data/id3"
import { distinct } from "../util/distinct"
import { delMany, keys } from "idb-keyval"

import TracksWorker from '../workers/tracks.worker?sharedworker'

const worker = new TracksWorker()

export type Mp3WebWorkerRequest = {
    event: 'load';
    handles: FileSystemFileHandle[];
}

export type Mp3WebWorkerResponse = {
    event: 'loaded';
    n: number;
    total: number;
    file: string;
    meta: ID3;
} | {
    event: 'error';
    error: string;
    n?: number;
    total?: number;
    file?: string;
} | {
    event: 'debug';
    debug: any;
    n?: number;
    total?: number;
    file?: string;
}

export function useTracks() {
    const [tracks, setTracks] = useGlobalState<ID3[]>('tracks', [])
    const [isLoading, setIsLoading] = useState(false)
    const [ error, setError] = useState<undefined|Error>()
    const distinctByName = useCallback(distinct('fileName'), [])

    function add(track: ID3) {
        setTracks(prev => distinctByName<ID3>([...prev, track]))
    }

    function remove(...tracks: ID3[]) {
        const names = new Set(tracks.map(t => t.fileName))
        setTracks(prev => [...prev.filter(e => !names.has(e.fileName))])
    }

    async function clear() {
        await delMany((await keys()).filter((k) => typeof k === "string" && k.startsWith("track")))
        setTracks([])
    }

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

        load(handles)
    }

    async function load(items: FileSystemFileHandle[]) {
        setIsLoading(true)
        worker.port.postMessage({ event: 'load', handles: items })
    }


    return {
        tracks,
        add,
        remove,
        clear,
        load,
        onDrop,
        isLoading,
        error
    }
}