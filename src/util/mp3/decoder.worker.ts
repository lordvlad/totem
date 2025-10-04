import { set } from "idb-keyval";
import { load } from "./id3";
import type { Mp3WebWorkerRequest, Mp3WebWorkerResponse } from "./decoder";

let currentProjectUuid: string | null = null;

function getProjectKey(key: string): string {
  if (currentProjectUuid == null) {
    return key; // Backward compatibility
  }
  return `project:${currentProjectUuid}:${key}`;
}

function loadAll(handles: FileSystemFileHandle[]) {
  (async () => {
    let n = -1;
    const total = handles.length;
    for (const handle of handles) {
      try {
        n++;
        const file = await handle.getFile();
        const { data, ...meta } = await load(file.stream());
        const uuid = crypto.randomUUID();
        await set(getProjectKey(`data:${uuid}`), data);
        await set(getProjectKey(`track:${uuid}`), {
          ...meta,
          fileName: handle.name,
          uuid,
        });
        emit({
          event: "loaded",
          meta: { ...meta, fileName: handle.name, uuid },
          file: handle.name,
          n,
          total,
        });
      } catch (e) {
        emit({ event: "error", file: handle.name, error: String(e), n, total });
      }
    }
  })().catch((e: unknown) => emit({ event: "error", error: String(e) }));
}

function emit(resp: Mp3WebWorkerResponse, b = true) {
  try {
    postMessage(resp);
  } catch (e) {
    console.error(e);
    if (b) emit({ event: "error", error: String(e) }, false);
  }
}

function isReq(x: unknown): x is Mp3WebWorkerRequest {
  return x != null && typeof x === "object" && "event" in x;
}

// eslint-disable-next-line complexity -- This function handles multiple event types
function handleMessage(event: Event) {
  if ("data" in event && isReq(event.data)) {
    switch (event.data.event) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- this is only the first case
      case "load":
        currentProjectUuid = event.data.projectUuid ?? null;
        loadAll(event.data.handles);
        break;
    }
  } else if ("isTrusted" in event) {
    // TODO find out where this event is coming from.
    console.info("isTrusted:", event.isTrusted);
  } else {
    throw new Error(`Unhandled event: ${JSON.stringify(event)}`);
  }
}

self.addEventListener("message", handleMessage);

self.addEventListener("error", (e) => {
  console.error(e);
  emit({ event: "error", error: e.message });
});

self.addEventListener("unhandledrejection", (e) => {
  console.error(e);
  emit({ event: "error", error: JSON.stringify(e.reason) });
});
