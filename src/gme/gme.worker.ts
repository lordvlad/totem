/// <reference lib="WebWorker" />

// export empty type because of tsc --isolatedModules flag
export type { };
declare const self: WorkerGlobalScope;

import { fromWritablePort } from "remote-web-streams";
import { isReq, build } from "./gme";
import { get } from "idb-keyval";



self.addEventListener("error", e => console.error(e))
self.addEventListener("unhandledrejection", e => console.error(e))
self.addEventListener("message", async (event: Event) => {
    if ("data" in event && isReq(event.data)) {
        switch (event.data.event) {
            case "build":
                const { event: ev1, writablePort, ...cfg } = event.data
                try {
                    const w = fromWritablePort<Uint8Array>(writablePort);
                    build(cfg, async ({ track }) => (await get<Uint8Array>(`data:${track.fileName}`))!).pipeTo(w)
                } catch (e) {
                    postMessage({ event: "error", error: String(e) })
                }
                break
        }
    } else if ("isTrusted" in event) {
        // TODO find out where this event is coming from.
        console.info("isTrusted:", event.isTrusted)
    } else {
        throw new Error(`Unhandled event: ${JSON.stringify(event)}`)
    }
})



