/// <reference lib="WebWorker" />

// export empty type because of tsc --isolatedModules flag
export type { };
declare const self: WorkerGlobalScope;

import { set } from 'idb-keyval'
import { load } from '../../util/id3'
import { type Mp3WebWorkerRequest, type Mp3WebWorkerResponse } from './decoder';

async function loadAllW(handles: FileSystemFileHandle[]) {
    let n = -1
    const total = handles.length
    for (const handle of handles) {
        try {
            n++
            const file = await handle.getFile()
            const { data, ...meta } = await load(file.stream())
            await set(`track:${handle.name}`, { data, ...meta, fileName: handle.name })
            emit({ event: "loaded", meta: { ...meta, fileName: handle.name }, file: handle.name, n, total })
        } catch (e) {
            emit({ event: 'error', file: handle.name, error: String(e), n, total })
        }
    }
}

function emit(resp: Mp3WebWorkerResponse, b = true) {
    try {
        postMessage(resp)
    } catch (e) {
        console.error(e)
        if (b) emit({ event: "error", error: String(e) }, false)
    }
}

function isReq(x: any): x is Mp3WebWorkerRequest {
    return x != null && typeof x === "object" && "event" in x
}

self.addEventListener("message", (event: Event) => {
    console.log("onmessage", event)
    if ("data" in event && isReq(event.data)) {
        switch (event.data.event) {
            case "load": return loadAllW(event.data.handles)
        }
    }

    throw new Error(`Unhandled event: ${JSON.stringify(event)}`)
})

self.addEventListener("error", e => {
    console.error(e)
    emit({ event: "error", error: String(e) })
})

self.addEventListener("unhandledrejection", e => {
    console.error(e)
    emit({ event: "error", error: String(e) })
})
