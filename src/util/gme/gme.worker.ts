/// <reference lib="WebWorker" />

// export empty type because of tsc --isolatedModules flag
export type { };
declare const self: WorkerGlobalScope;

import { fromWritablePort } from "remote-web-streams";
import { get } from "idb-keyval";
import { isReq, build, type MediaTableItem, Req } from "./gme";
import { singleChunkStream } from "../singleChunkStream";


async function fetchMedia({ track }: MediaTableItem) {
    const data = await get<Uint8Array>(`data:${track.fileName}`)
    if (!data) throw new Error(`Missing track data for ${track.fileName}`)
    return singleChunkStream(data)
}

function doBuild({ event: ignored, writablePort, ...cfg }: Req) {
    build(cfg, fetchMedia)
        .pipeTo(fromWritablePort<Uint8Array>(writablePort) as WritableStream<Uint8Array>)
        .catch((e: unknown) => postMessage({ event: "error", error: String(e) }))
}

self.addEventListener("error", e => console.error(e))
self.addEventListener("unhandledrejection", e => console.error(e))
self.addEventListener("message", (event: Event) => {
    if ("data" in event && isReq(event.data)) {
        switch (event.data.event) {
            case "build":
                doBuild(event.data)
                break
        }
    } else if ("isTrusted" in event) {
        // TODO find out where this event is coming from.
        console.info("isTrusted:", event.isTrusted)
    } else {
        throw new Error(`Unhandled event: ${JSON.stringify(event)}`)
    }
})



