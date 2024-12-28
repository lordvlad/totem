/* eslint-disable complexity -- not so hard really */
/* eslint-disable @typescript-eslint/consistent-type-definitions -- allow both styles here */
import { assert, is } from "tsafe/assert";
import { concatBuffers } from "../concatBuffers";
import { FRAMES } from "./frames";
import { PICTURE_TYPE } from "./pictureTypes";

const asciiDecoder = new TextDecoder("ascii");
const utf8Decoder = new TextDecoder("utf8");
const utf16Decoder = new TextDecoder("utf-16");
const utf16BEDecoder = new TextDecoder("utf-16be");
const latinDecoder = new TextDecoder("latin1");

export type BrokenFrame = {
  size: number;
};

export type Frame = {
  id: FrameId;
  size: number;
  flags: null | {
    message: {
      tag_alter_preservation: boolean;
      file_alter_preservation: boolean;
      read_only: boolean;
    };
    format: {
      grouping_identity: boolean;
      compression: boolean;
      encryption: boolean;
      unsync: boolean;
      data_length_indicator: boolean;
    };
  };
  frameDataSize: number | null;
  description: string;
  data: unknown;
};

export type ID3 = {
  version: [2 | 3 | 4, number];
  unsync: boolean;
  tagSize: number;
  fileName: string;
  xheader: boolean;
  xindicator: boolean;
  frames: Partial<Record<FrameId, Frame | Frame[]>>;
};

export type FrameId = keyof typeof FRAMES;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- allows us to save one cast
export function getFrameData<T = unknown>(id3: ID3, id: FrameId) {
  const frames = id3.frames[id];
  const frame: Frame | undefined = Array.isArray(frames) ? frames[0] : frames;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- we know what can  happen
  return frame?.data as T;
}
export function title(id3: ID3) {
  return getFrameData<string>(id3, "TIT2");
}
export function artist(id3: ID3) {
  return getFrameData<string>(id3, "TOA");
}
export function album(id3: ID3) {
  return getFrameData<string>(id3, "TALB");
}

function isBitSetAt(buf: DataView, offset: number, bit: number) {
  return (buf.getUint8(offset) & (1 << bit)) !== 0;
}

function readTagSize(view: DataView, off: number) {
  const b1 = view.getUint8(off);
  const b2 = view.getUint8(off + 1);
  const b3 = view.getUint8(off + 2);
  const b4 = view.getUint8(off + 3);

  return (
    (b4 & 0x7f) | ((b3 & 0x7f) << 7) | ((b2 & 0x7f) << 14) | ((b1 & 0x7f) << 21)
  );
}

function getInt24(view: DataView, offset: number, littleEndian?: boolean) {
  return (littleEndian ?? false)
    ? view.getUint8(offset) |
        (view.getUint8(offset + 1) << 8) |
        (view.getUint8(offset + 2) << 16)
    : view.getUint8(offset + 2) |
        (view.getUint8(offset + 1) << 8) |
        (view.getUint8(offset) << 16);
}

function readFrameFlags(view: DataView, offset: number) {
  return {
    message: {
      tag_alter_preservation: isBitSetAt(view, offset, 6),
      file_alter_preservation: isBitSetAt(view, offset, 5),
      read_only: isBitSetAt(view, offset, 4),
    },
    format: {
      grouping_identity: isBitSetAt(view, offset + 1, 7),
      compression: isBitSetAt(view, offset + 1, 3),
      encryption: isBitSetAt(view, offset + 1, 2),
      unsync: isBitSetAt(view, offset + 1, 1),
      data_length_indicator: isBitSetAt(view, offset + 1, 0),
    },
  };
}

function getTextDecoder(view: DataView, offset: number) {
  const b = view.getUint8(offset);
  switch (b) {
    case 0x00:
      return latinDecoder; // iso-8859-1
    case 0x01:
      return utf16Decoder;
    case 0x02:
      return utf16BEDecoder;
    default:
      return utf8Decoder;
  }
}

function readPictureFrame(
  view: DataView,
  offsetParam: number,
  length: number,
  version: [2 | 3 | 4, number],
) {
  const decoder = getTextDecoder(view, offsetParam);

  const mimetype = (() => {
    switch (version[0]) {
      case 2:
        return decodeText(view, offsetParam + 1, 3, decoder);
      case 3:
      case 4:
        return readNullTerminatedText(view, offsetParam + 1, decoder);
    }
  })();
  let offset = offsetParam + 1 + bytelegth(mimetype);
  const bite = view.getUint8(offset);
  const type = PICTURE_TYPE[bite];
  const description = readNullTerminatedText(view, offset + 1, decoder);
  offset += 2 + bytelegth(description);

  return {
    mimetype,
    type,
    description,
    data: view.buffer.slice(offset, offsetParam + length),
  };
}

export type ID3Art = ReturnType<typeof readPictureFrame>;

function readNullTerminatedText(
  view: DataView,
  offset: number,
  decoder: TextDecoder,
) {
  const begin = view.byteOffset + offset;
  const end = view.byteLength;
  let i = begin;
  while (i < end && view.getUint8(i) !== 0) i++;
  return decoder.decode(new Uint8Array(view.buffer.slice(begin, i)));
}

function readFrameData(
  view: DataView,
  frame: Omit<Frame, "data">,
  offsetParam: number,
  version: [2 | 3 | 4, number],
) {
  let offset = offsetParam;
  const size = frame.frameDataSize ?? frame.size;

  // text frames
  if (frame.id.startsWith("T")) {
    const decoder = getTextDecoder(view, offset);
    offset += 1;
    const begin = view.byteOffset + offset;
    const text = decodeText(view, begin, size, decoder);

    switch (frame.id) {
      case "TCO":
      case "TCON":
        return text.replace(/^\(\d+\)/, "");
      default:
        return text;
    }
  }

  // other frames
  switch (frame.id) {
    case "APIC":
      return readPictureFrame(view, offset, size, version);

    default:
      console.warn(`Reading '${frame.id} not implemented'`);
  }

  return null;
}

function decodeText(
  view: DataView,
  begin: number,
  size: number,
  decoder: TextDecoder,
) {
  const slice = view.buffer.slice(begin, begin + size - 1);
  const buf =
    new Uint8Array(slice).at(-1) === 0
      ? slice.slice(0, slice.byteLength - 1)
      : slice;
  const text = decoder.decode(new Uint8Array(buf.slice(0, buf.byteLength)));
  return text;
}

function isFrameId(s: string): s is FrameId {
  return s in FRAMES;
}

function readFrame(
  view: DataView,
  id3: Omit<ID3, "fileName" | "frames">,
  offsetParam: number,
): BrokenFrame | Frame {
  const major = id3.version[0];
  let offset = offsetParam;

  const buf = view.buffer.slice(
    view.byteOffset + offset,
    view.byteOffset + offset + (major === 2 ? 3 : 4),
  );
  const id = asciiDecoder.decode(new Uint8Array(buf.slice(0, buf.byteLength)));
  offset += major === 2 ? 3 : 4;

  const size =
    major === 2
      ? getInt24(view, offset, false)
      : major === 3
        ? view.getUint32(offset + 4, false)
        : readTagSize(view, offset);

  if (!isFrameId(id)) return { size } satisfies BrokenFrame;

  offset += major === 2 ? 3 : 4;

  const flags = major > 2 ? readFrameFlags(view, offset) : null;
  offset += major > 2 ? 2 : 0;

  if (flags?.format.unsync ?? false) return { size } satisfies BrokenFrame;

  const frameDataSize =
    (flags?.format.data_length_indicator ?? false)
      ? readTagSize(view, offset)
      : null;

  offset += (flags?.format.data_length_indicator ?? false) ? 4 : 0;

  const frame = {
    id,
    size: frameDataSize === null ? size : size - 4,
    flags,
    frameDataSize,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- catch possibly unknown ids
    description: FRAMES[id] ?? "unknown",
  };

  const data = readFrameData(view, frame, offset, id3.version);

  return { ...frame, data };
}

function isFrameOk(f: BrokenFrame | Frame): f is Frame {
  return "id" in f && f.id.length !== 0;
}

function readFrames(
  view: DataView,
  id3: Omit<ID3, "fileName" | "frames">,
  offset: number,
) {
  const major = id3.version[0];
  const frames: Partial<Record<FrameId, Frame | Frame[]>> = {};
  const frameHeaderSize = major === 2 ? 6 : 10;

  while (offset < id3.tagSize) {
    const frame = readFrame(view, id3, offset);

    if (isFrameOk(frame)) {
      if (frame.id in frames) {
        if (!Array.isArray(frames[frame.id])) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- we know what we're doing
          frames[frame.id] = [frames[frame.id] as Frame];
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- we know what we're doing
        (frames[frame.id] as Frame[]).push(frame);
      } else {
        frames[frame.id] = frame;
      }
    }

    offset += frameHeaderSize + frame.size;
  }

  return frames;
}

async function readTags(
  stream: ReadableStreamDefaultReader<Uint8Array>,
): Promise<Omit<ID3, "fileName">> {
  const getBuffer = (() => {
    const chunks: Uint8Array[] = [];

    const getBuf = async () => await new Blob(chunks).arrayBuffer();

    let buf = new Uint8Array().buffer;

    return async (n: number) => {
      while (buf.byteLength < n) {
        const { value, done } = await stream.read();
        if (!done) chunks.push(value);
        buf = await getBuf();
      }
      return buf;
    };
  })();

  const buf = await getBuffer(10);

  if (asciiDecoder.decode(buf.slice(0, 3)) !== "ID3") {
    throw new Error("No ID3 tag found");
  }

  const view = new DataView(buf);

  const major = view.getUint8(3);
  const minor = view.getUint8(4);

  assert(is<2 | 3 | 4>(major));

  const id3: Omit<ID3, "fileName" | "frames"> = {
    version: [major, minor],
    unsync: isBitSetAt(view, 5, 7),
    xheader: isBitSetAt(view, 5, 6),
    xindicator: isBitSetAt(view, 5, 5),
    tagSize: readTagSize(view, 6),
  };

  const offset = id3.xheader ? view.getUint32(10, false) + 4 : 0;

  const frames = readFrames(view, id3, offset + 10);

  return { ...id3, frames };
}

async function readAll(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  try {
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return concatBuffers(...chunks);
  } finally {
    reader.releaseLock();
  }
}

async function readMeta(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  try {
    return await readTags(reader);
  } finally {
    reader.releaseLock();
  }
}

export async function load(stream: ReadableStream<Uint8Array>) {
  const [s1, s2] = stream.tee();
  const meta = await readMeta(s1);
  const data = await readAll(s2);

  return { ...meta, data, size: data.byteLength };
}

export async function* loadAll(...streams: Array<ReadableStream<Uint8Array>>) {
  for (const stream of streams) {
    yield await load(stream);
  }
}

function bytelegth(format: string) {
  return new TextEncoder().encode(format).length;
}
