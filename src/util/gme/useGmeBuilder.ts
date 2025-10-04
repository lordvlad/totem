import { RemoteReadableStream } from "remote-web-streams";
import type { GmeBuildConfig, Req } from "./gme";
import GMEBuilderWorker from "./gme.worker?worker";
import { getCurrentProjectUuid } from "../../hooks/useCurrentProject";

const worker = new GMEBuilderWorker();

worker.addEventListener("error", (e) =>
  console.error(e, JSON.stringify(e), e.message),
);

worker.addEventListener("messageerror", (e) => console.error(e));
worker.addEventListener("message", (e) => console.log("message", e));

export function useGmeBuilder() {
  return {
    build(cfg: GmeBuildConfig) {
      const { readable, writablePort } = new RemoteReadableStream<Uint8Array>();
      const req: Req = {
        event: "build",
        ...cfg,
        writablePort,
        projectUuid: getCurrentProjectUuid() ?? undefined,
      };
      worker.postMessage(req, [writablePort]);
      return readable;
    },
  };
}
