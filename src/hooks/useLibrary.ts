import { delMany, getMany, keys, setMany } from "idb-keyval";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { distinct } from "../util/distinct";
import { hydrate } from "../util/hydrate";
import type {
  Mp3WebWorkerRequest,
  Mp3WebWorkerResponse,
} from "../util/mp3/decoder";
import { Track } from "../util/mp3/track";
import DecoderWorker from "../util/mp3/decoder.worker?worker";
import { assert, is } from "tsafe";
import { getAsFileSystemHandle } from "../util/fileSystemFallback";

const worker = new DecoderWorker();

const listeners = new Map<() => unknown, Dispatch<SetStateAction<unknown>>>();

let state = {
  isLoading: false,
  tracks: [] as Track[],
  error: null as null | Error,
};

type S = typeof state;
type A =
  | Mp3WebWorkerRequest
  | Mp3WebWorkerResponse
  | { event: "init" }
  | { event: "initialized"; tracks: Track[] }
  | { event: "clear" }
  | { event: "cleared" }
  | { event: "update"; tracks: Track[] }
  | { event: "updated"; tracks: Track[] }
  | { event: "remove"; tracks: Track[] }
  | { event: "removed"; tracks: Track[] };

const distinctByName = distinct("uuid");

async function onDrop(items: DataTransferItem[]) {
  const handlePromises = items.map(async (item) => {
    if (item.kind === "file") {
      const handle = await getAsFileSystemHandle(item);
      if (handle != null) return handle;
    }
    console.error("Item dropped is not a file", item);
    return null;
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- we're removing falsy ones
  const handles = (await Promise.all(handlePromises)).filter(
    Boolean,
  ) as FileSystemFileHandle[];

  dispatch({ event: "load", handles });
}

function remove(...tracks: Track[]) {
  dispatch({ event: "remove", tracks });
}

function clear() {
  dispatch({ event: "clear" });
}

function load(handles: FileSystemFileHandle[]) {
  dispatch({ event: "load", handles });
}

function update(...tracks: Track[]) {
  dispatch({ event: "update", tracks });
}

function reduce(s: typeof state, action: A): S {
  switch (action.event) {
    case "load":
      worker.postMessage({ event: "load", handles: action.handles });
      return { ...s, isLoading: true };
    case "loaded":
      return {
        ...s,
        isLoading: action.n !== action.total - 1,
        tracks: distinctByName<Track>([
          ...s.tracks,
          hydrate(action.meta, Track),
        ]),
      };
    case "error":
      console.error(action);
      return s;
    case "debug":
      console.log(action);
      return s;
    case "remove":
      Promise.all([
        delMany(action.tracks.map((t) => `track:${t.uuid}`)),
        delMany(action.tracks.map((t) => `data:${t.uuid}`)),
      ])
        .then(() => dispatch({ event: "removed", tracks: action.tracks }))
        .catch((e1: unknown) => console.error(e1));
      return { ...s, isLoading: true };
    case "removed":
      return {
        ...s,
        isLoading: false,
        tracks: s.tracks.filter(
          (t) => !new Set(action.tracks.map((t) => t.uuid)).has(t.uuid),
        ),
      };
    case "clear":
      Promise.all([
        delMany(s.tracks.map((t) => `track:${t.uuid}`)),
        delMany(s.tracks.map((t) => `data:${t.uuid}`)),
      ])
        .then(() => dispatch({ event: "cleared" }))
        .catch((e1: unknown) => console.error(e1));
      return { ...s, isLoading: true };
    case "cleared":
      return { ...s, isLoading: false, tracks: [] };
    case "init":
      keys()
        .then(
          async (ks) =>
            await getMany(
              ks.filter((k) => typeof k === "string" && k.startsWith("track")),
            ).then((items) =>
              items.map((i) => {
                assert(is<Record<string, unknown>>(i));
                return i;
              }),
            ),
        )
        .then((items) => items.map((item) => hydrate(item, Track)))
        .then((tracks) => dispatch({ event: "initialized", tracks }))
        .catch((e1: unknown) => console.error(e1));
      return { ...s, isLoading: true, tracks: [] };
    case "initialized":
      return { ...s, isLoading: false, tracks: action.tracks };
    case "update":
      setMany(action.tracks.map((track) => [`track:${track.uuid}`, track]))
        .then(() => dispatch({ event: "updated", tracks: action.tracks }))
        .catch((e1: unknown) => console.error(e1));
      return { ...s, isLoading: true };
    case "updated":
      return { ...s, isLoading: false };
  }
}

worker.addEventListener(
  "error",
  (e) => console.error(e, JSON.stringify(e), e.message),
  { capture: true },
);
worker.addEventListener("messageerror", (e) => console.error(e));
worker.addEventListener("message", ({ data }) => {
  assert(is<A>(data));
  dispatch(data);
});

export function dispatch(action: A) {
  let i = 0;
  const prevValues = Array.from(listeners, ([getValue]) => getValue());
  state = reduce(state, action);
  listeners.forEach((setValue, getValue) => {
    const value = getValue();
    if (value !== prevValues[i++]) setValue(value);
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- fine by me
const r = {
  dispatch,
  remove,
  onDrop,
  clear,
  load,
  update,
};

type R = typeof r;

function toGetter(getValue: unknown): () => unknown {
  if (typeof getValue === "string") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- we know what we're doing
    return () => state[getValue as keyof S];
  }
  if (typeof getValue === "function") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- we know what we're doing
    return getValue as () => unknown;
  }
  throw new Error("FOO");
}

export function useLibrary<K extends keyof S>(key: K): R & { value: S[K] };
export function useLibrary<T>(getter: (s: S) => T): R & { value: T };
export function useLibrary(): R & { value: S };
export function useLibrary(getValue?: unknown) {
  const getter =
    typeof getValue === "undefined" ? () => state : toGetter(getValue);
  const [value, setValue] = useState<unknown>(getter());

  useEffect(() => {
    listeners.set(getter, setValue);
    return () => {
      listeners.delete(getter);
    };
  }, [getter]);
  return {
    value,
    dispatch,
    remove,
    onDrop,
    clear,
    load,
    update,
  };
}

dispatch({ event: "init" });
