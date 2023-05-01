/// <reference lib="WebWorker" />

// export empty type because of tsc --isolatedModules flag
export type { };
declare const self: SharedWorkerGlobalScope;

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
            await set(`track:${handle.name}`, { data, ...meta })
            emit({ event: "loaded", meta: { ...meta, fileName: handle.name }, file: handle.name, n, total })
        } catch (e) {
            emit({ event: 'error', file: handle.name, error: String(e), n, total })
        }
    }
}

const allPorts: MessagePort[] = []

function emit(resp: Mp3WebWorkerResponse, b = true) {
    allPorts.forEach(port => {
        try {
            port.postMessage(resp)
        } catch (e) {
            console.error(e)
            if (b) emit({ event: "error", error: String(e) }, false)
        }
    })
}

async function onMessage({ data }: MessageEvent<Mp3WebWorkerRequest>) {
    switch (data.event) {
        case "load": loadAllW(data.handles)
    }
}

self.addEventListener("connect", ({ ports }) => {
    const port = ports[0]
    port.addEventListener("message", onMessage)
    allPorts.push(port)
})