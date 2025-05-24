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
  | { event: "removed"; tracks: Track[] }
  | { event: "add_recording"; track: Track; blob: Blob }
  | { event: "recording_added"; track: Track };

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

// Helper function to get audio duration from a Blob
async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    const objectURL = URL.createObjectURL(blob);

    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      URL.revokeObjectURL(objectURL);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      if (timer) clearTimeout(timer);
    };

    const handleLoadedMetadata = () => {
      cleanup();
      resolve(audio.duration);
    };

    const handleError = (e?: Event | string) => {
      cleanup();
      console.error("Error loading audio for duration:", e || "Unknown error");
      reject(new Error("Could not get audio duration."));
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);

    audio.src = objectURL;
    
    timer = setTimeout(() => {
      // Check if metadata is already loaded by any chance or if src is still not processed.
      if (audio.readyState === 0 || !audio.duration) { 
        handleError("Timeout getting audio duration: No metadata loaded within 10s.");
      } else {
        // If duration is available by now, resolve. This case might be redundant if loadedmetadata always fires.
        cleanup();
        resolve(audio.duration);
      }
    }, 10000); // 10 seconds timeout
  });
}

// New function to add a recording
async function addRecording(mp3Blob: Blob, filename: string) {
  try {
    const duration = await getAudioDuration(mp3Blob);
    // Ensure filename has .mp3 extension
    const finalFilename = filename.endsWith('.mp3') ? filename : `${filename}.mp3`;
    const title = finalFilename.substring(0, finalFilename.lastIndexOf('.')) || finalFilename;

    const trackData = {
      fileName: finalFilename,
      title: title,
      artist: "Unknown Artist", 
      album: "Recorded Tracks",  
      duration: duration,
      // bpm, year, pictureMimeType, pictureData, lyrics will use Track class defaults or be undefined
    };
    // The Track class might initialize other fields to defaults if not provided.
    // hydrate is used elsewhere for plain objects from IDB, direct instantiation for new objects.
    const newTrack = new Track(trackData.fileName, trackData.title, trackData.artist, trackData.album, trackData.duration, undefined, undefined, undefined, undefined, undefined);


    dispatch({ event: "add_recording", track: newTrack, blob: mp3Blob });
  } catch (error) {
    console.error("Error preparing recording for dispatch:", error);
    dispatch({ event: "error", error: error instanceof Error ? error : new Error(String(error)), message: "Failed to prepare recording." });
  }
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
    case "add_recording":
      setMany([
        [`track:${action.track.fileName}`, action.track.toPlainObject()], // Store plain object for Track
        [`data:${action.track.fileName}`, action.blob],
      ])
        .then(() => {
          dispatch({ event: "recording_added", track: action.track });
        })
        .catch((e1: unknown) => {
          console.error("Error saving recording to IndexedDB:", e1);
          dispatch({ event: "error", error: e1 instanceof Error ? e1 : new Error(String(e1)), message: "Failed to save recording to database." });
           return { ...s, isLoading: false, error: e1 instanceof Error ? e1 : new Error(String(e1)) }; // Set loading false and error
        });
      return { ...s, isLoading: true, error: null }; // Set loading true and clear previous error
    case "recording_added":
      // Ensure no duplicate tracks by filename before adding
      if (s.tracks.some(t => t.fileName === action.track.fileName)) {
        console.warn(`Track with filename ${action.track.fileName} already exists. Skipping addition.`);
        return { ...s, isLoading: false }; // Already exists, do nothing or update
      }
      return {
        ...s,
        isLoading: false,
        tracks: distinctByName<Track>([...s.tracks, action.track]), 
        error: null, // Clear error on success
      };
    // Ensure existing error case also sets isLoading to false
    case "error":
      console.error(action.message, action.error); // Log the message and error object
      return { ...s, isLoading: false, error: action.error }; // Update state with error and set loading to false

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
  addRecording, // Export new function
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
    addRecording, // Add to returned object
  };
}

dispatch({ event: "init" });
