/// <reference lib="WebWorker" />

// export empty type because of tsc --isolatedModules flag
import { set } from 'idb-keyval'
import { load } from './id3'
import { type Mp3WebWorkerRequest, type Mp3WebWorkerResponse } from './decoder'

export type { }
declare const self: WorkerGlobalScope

function loadAll (handles: FileSystemFileHandle[]) {
  (async () => {
    let n = -1
    const total = handles.length
    for (const handle of handles) {
      try {
        n++
        const file = await handle.getFile()
        const { data, ...meta } = await load(file.stream())
        await set(`data:${handle.name}`, data)
        await set(`track:${handle.name}`, { ...meta, fileName: handle.name })
        emit({ event: 'loaded', meta: { ...meta, fileName: handle.name }, file: handle.name, n, total })
      } catch (e) {
        emit({ event: 'error', file: handle.name, error: String(e), n, total })
      }
    }
  })().catch(e => emit({ event: 'error', error: String(e) }))
}

function emit (resp: Mp3WebWorkerResponse, b = true) {
  try {
    postMessage(resp)
  } catch (e) {
    console.error(e)
    if (b) emit({ event: 'error', error: String(e) }, false)
  }
}

function isReq (x: any): x is Mp3WebWorkerRequest {
  return x != null && typeof x === 'object' && 'event' in x
}

self.addEventListener('message', (event: Event) => {
  if ('data' in event && isReq(event.data)) {
    switch (event.data.event) {
      case 'load':
        loadAll(event.data.handles)
        break
    }
  } else if ('isTrusted' in event) {
    // TODO find out where this event is coming from.
    console.info('isTrusted:', event.isTrusted)
  } else {
    throw new Error(`Unhandled event: ${JSON.stringify(event)}`)
  }
})

self.addEventListener('error', e => {
  console.error(e)
  emit({ event: 'error', error: String(e) })
})

self.addEventListener('unhandledrejection', e => {
  console.error(e)
  emit({ event: 'error', error: String(e) })
})
