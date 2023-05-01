import { createContext } from "preact";
import { useContext, useState, useEffect } from "preact/hooks";

import TracksWorker from './decoder.worker?sharedworker'
import { Mp3WebWorkerResponse } from "../tracks";

export class Library {
    private worker: SharedWorker;
    private _isLoading: boolean;
    private _isLoadingListeners: Set<((toggle: boolean) => void)>;

    constructor() {

        this.worker = new TracksWorker()
        this._isLoading = false
        this._isLoadingListeners = new Set()

        this.worker.addEventListener("error", e => {
            console.error(e)
        })

        this.worker.port.addEventListener("messageerror", e => {
            console.error(e)
        })

        this.worker.port.addEventListener("message", ({ data }: MessageEvent<Mp3WebWorkerResponse>) => {
            switch (data.event) {
                case "loaded": {
                    this.add(data.meta)
                    if (data.n === data.total) this.isLoading = false
                    break;
                }
                case "error": {

                }
                case "debug": console.log(data)
            }
        })

    }

    add(meta: ID3) {

    }

    async onDrop(items: DataTransferItem[]) {
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

        this.load(handles)
    }

    private load(handles: FileSystemFileHandle[]) {
        this.isLoading = true
        this.worker.port.postMessage({ event: 'load', handles })
    }

    get isLoading() { return this._isLoading }
    private set isLoading(toggle: boolean) {
        this._isLoading = toggle
        this._isLoadingListeners.forEach(l => l(toggle))
    }


    useHook() {

        const setIsLoading = useState(false)[1]
        useEffect(() => {
            this._isLoadingListeners.add(setIsLoading)
            return () => this._isLoadingListeners.delete(setIsLoading)
        })


        return {
            isLoading: this.isLoading,
            load: this.load,
            onDrop: this.onDrop,
        }

    }

}

export const LibraryContext = createContext<Library>(null as unknown as Library)


export function useLibrary() {
    const library = useContext(LibraryContext)
    if (library === null) throw new Error("Missing LibraryContext.Provider")
    return library.useHook()
}

