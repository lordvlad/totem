import { delMany, getMany, keys, setMany } from "idb-keyval";
import { useEffect, useState } from "react";
import { distinct } from "../util/distinct";
import { hydrate } from "../util/hydrate";
import type {
  Mp3WebWorkerRequest,
  Mp3WebWorkerResponse,
} from "../util/mp3/decoder";
import { Track } from "../util/mp3/track";
import DecoderWorker from "../util/mp3/decoder.worker?worker";
import { assert, is } from "tsafe";

const worker = new DecoderWorker();
// const worker = new Worker(
//   new URL("../util/mp3/decoder.worker.ts", import.meta.url),
//   { type: "module" },
// );

const listeners = new Map();

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

const distinctByName = distinct("fileName");

async function onDrop(items: DataTransferItem[]) {
  const handlePromises = items.map(async (item) => {
    if (item.kind === "file") {
      const handle = await item.getAsFileSystemHandle();
      if (handle != null && handle.kind === "file") return handle;
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
        delMany(action.tracks.map((t) => `track:${t.fileName}`)),
        delMany(action.tracks.map((t) => `data:${t.fileName}`)),
      ])
        .then(() => dispatch({ event: "removed", tracks: action.tracks }))
        .catch((e1: unknown) => console.error(e1));
      return { ...s, isLoading: true };
    case "removed":
      return {
        ...s,
        isLoading: false,
        tracks: s.tracks.filter(
          (t) => !new Set(action.tracks.map((t) => t.fileName)).has(t.fileName),
        ),
      };
    case "clear":
      Promise.all([
        delMany(s.tracks.map((t) => `track:${t.fileName}`)),
        delMany(s.tracks.map((t) => `data:${t.fileName}`)),
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
      setMany(action.tracks.map((track) => [`track:${track.fileName}`, track]))
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
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- we know what we're doing
worker.addEventListener("message", ({ data }) => dispatch(data));

export function dispatch(action: A) {
  let i = 0;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call -- we know what we're doing
  const prevValues = Array.from(listeners, ([getValue]) => getValue(state));
  state = reduce(state, action);
  listeners.forEach((setValue, getValue) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- we know what we're doing
    const value = getValue(state);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- we know what we're doing
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

export function useLibrary<K extends keyof S>(key: K): R & { value: S[K] };
export function useLibrary<T>(getter: (s: S) => T): R & { value: T };
export function useLibrary(): R & { value: S };

export function useLibrary(getValue?: unknown) {
  const getter =
    typeof getValue === "undefined"
      ? () => state
      : typeof getValue === "string"
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- we're checking
          () => state[getValue as keyof S]
        : typeof getValue === "function"
          ? getValue
          : () => {
              throw new Error("FOO");
            };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- we know what we're doing
  const [value, setValue] = useState<unknown>(getter(state));

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
