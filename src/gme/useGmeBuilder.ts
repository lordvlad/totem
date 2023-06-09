import { RemoteReadableStream } from "remote-web-streams";
import { GmeBuildConfig, type Req } from "./gme";

const worker = new Worker(new URL('./gme.worker.ts', import.meta.url), { type: 'module' })

worker.addEventListener("error", e => console.error(e, JSON.stringify(e), e.message))
worker.addEventListener("messageerror", e => console.error(e))
worker.addEventListener("message", e => console.log("message", e))

export function useGmeBuilder() {
    return {
        build(cfg: GmeBuildConfig) {
            const { readable, writablePort } = new RemoteReadableStream<Uint8Array>();
            const req: Req = { event: 'build', ...cfg, writablePort }
            worker.postMessage(req, [writablePort])
            return readable
        }
    }
}
