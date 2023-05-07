import { FRAMES, type BrokenFrame, type Frame, type ID3, type FrameId } from "../data/id3"

const asciiDecoder = new TextDecoder("ascii")
const utf8Decoder = new TextDecoder("utf8")
const utf16Decoder = new TextDecoder("utf-16")
const utf16BEDecoder = new TextDecoder("utf-16be")
const latinDecoder = new TextDecoder("latin1")

function isBitSetAt(buf: DataView, offset: number, bit: number) {
    return (buf.getUint8(offset) & (1 << bit)) !== 0
}

function readTagSize(view: DataView, off: number) {
    const b1 = view.getUint8(off)!
    const b2 = view.getUint8(off + 1)!
    const b3 = view.getUint8(off + 2)!
    const b4 = view.getUint8(off + 3)!

    return (b4 & 0x7f)
        | ((b3 & 0x7f) << 7)
        | ((b2 & 0x7f) << 14)
        | ((b1 & 0x7f) << 21)
}

function getInt24(view: DataView, offset: number, littleEndian?: boolean) {
    return 0
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
        }
    }
}


function getTextDecoder(view: DataView, offset: number) {
    const b = view.getUint8(offset)
    switch (b) {
        case 0x00: return latinDecoder; // iso-8859-1
        case 0x01: return utf16Decoder;
        case 0x02: return utf16BEDecoder;
        default: return utf8Decoder
    }
}

function readFrameData(view: DataView, frame: Omit<Frame, 'data'>, offsetParam: number) {
    let offset = offsetParam
    const size = frame.frameDataSize ?? frame.size

    // text frames
    if (frame.id[0] === "T") {
        const decoder = getTextDecoder(view, offset)
        offset += 1
        const begin = view.byteOffset + offset
        const slice = view.buffer.slice(begin, begin + size - 1)
        const text = decoder.decode(
            new Uint8Array(slice).at(-1) === 0
                ? slice.slice(0, slice.byteLength - 1)
                : slice)

        switch (frame.id) {
            case 'TCO':
            case 'TCON':
                return text.replace(/^\(\d+\)/, '');
            default:
                return text
        }
    }

    // other frames
    switch (frame.id) {

    }

    return null
}

function isFrameId(s: string): s is FrameId {
    return s in FRAMES
}

function readFrame(view: DataView, id3: Omit<ID3, "fileName" | "frames">, offsetParam: number): BrokenFrame | Frame {
    const major = id3.version[0]
    let offset = offsetParam

    const id = asciiDecoder.decode(view.buffer.slice(view.byteOffset + offset, view.byteOffset + offset + (major === 2 ? 3 : 4)))
    offset += major === 2 ? 3 : 4

    const size = major === 2
        ? getInt24(view, offset, false)
        : major === 3
            ? view.getUint32(offset + 4, false)
            : readTagSize(view, offset)

    if (!isFrameId(id)) return { size } as BrokenFrame

    offset += major === 2 ? 3 : 4

    const flags = major > 2 ? readFrameFlags(view, offset) : null
    offset += major > 2 ? 2 : 0

    if (flags?.format.unsync) return { size } as BrokenFrame

    const frameDataSize = flags?.format.data_length_indicator
        ? readTagSize(view, offset)
        : null

    offset += flags?.format.data_length_indicator ? 4 : 0


    const frame = {
        id,
        size: frameDataSize === null ? size : size - 4,
        flags,
        frameDataSize,
        description: FRAMES[id] ?? 'unknown'
    }

    const data = readFrameData(view, frame, offset)

    return { ...frame, data }
}

function isFrameOk(f: BrokenFrame | Frame): f is Frame {
    return !!(f as any).id
}

function readFrames(view: DataView, id3: Omit<ID3, "fileName" | "frames">, offset: number) {
    const major = id3.version[0]
    const frames: Partial<Record<FrameId, Frame | Frame[]>> = Object.create(null)
    const frameHeaderSize = major === 2 ? 6 : 10

    while (offset < id3.tagSize) {
        const frame = readFrame(view, id3, offset)

        if (isFrameOk(frame)) {
            if (frame.id in frames) {
                if (!Array.isArray(frames[frame.id])) {
                    frames[frame.id] = [frames[frame.id] as Frame]
                }
                (frames[frame.id] as Frame[]).push(frame)
            } else {
                frames[frame.id] = frame
            }
        }

        offset += frameHeaderSize + frame.size
    }

    return frames
}

async function readTags(stream: ReadableStreamDefaultReader<Uint8Array>): Promise<Omit<ID3, "fileName">> {
    const getBuffer = (() => {
        const chunks: Uint8Array[] = []

        const getBuf = async () => await new Blob(chunks).arrayBuffer()

        let buf = new Uint8Array().buffer

        return async (n: number) => {
            while (buf.byteLength < n) {
                chunks.push((await stream.read()).value!)
                buf = await getBuf()
            }
            return buf
        }
    })();

    const buf = await getBuffer(10)

    if (asciiDecoder.decode(buf.slice(0, 3)) !== "ID3") throw new Error('No ID3 tag found')

    const view = new DataView(buf)

    const major = view.getUint8(3)!
    const minor = view.getUint8(4)!

    const id3: Omit<ID3, 'fileName' | 'frames'> = {
        version: [major, minor],
        unsync: isBitSetAt(view, 5, 7),
        xheader: isBitSetAt(view, 5, 6),
        xindicator: isBitSetAt(view, 5, 5),
        tagSize: readTagSize(view, 6),
    }


    const offset = id3.xheader ? (view.getUint32(10, false) + 4) : 0

    const frames = readFrames(view, id3, offset + 10)

    return { ...id3, frames }
}

function concat(...chunks: Uint8Array[]) {
    const length = chunks.reduce((l, chunk) => l + chunk.length, 0);
    return chunks.reduce(([offset, concatd], chunk) => {
        concatd.set(chunk, offset)
        return [offset + chunk.length, concatd] as [number, Uint8Array]
    }, [0, new Uint8Array(length)] as [number, Uint8Array])[1]
}

async function readAll(stream: ReadableStream<Uint8Array>) {
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
    try {
        reader = stream.getReader()
        const chunks: Uint8Array[] = []
        while (true) {
            const { done, value } = await reader.read();
            if (done) break
            chunks.push(value)
        }
        return concat(...chunks)
    } finally {
        reader?.releaseLock()
    }
}

async function readMeta(stream: ReadableStream<Uint8Array>) {
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
    try {
        return await readTags(stream.getReader())
    } finally {
        reader?.releaseLock()
    }
}

export async function load(stream: ReadableStream<Uint8Array>) {
    const [s1, s2] = stream.tee()
    const meta = await readMeta(s1)
    const data = await readAll(s2)

    return { ...meta, data, size: data.byteLength }
}

export async function* loadAll(...streams: ReadableStream<Uint8Array>[]) {
    for (const stream of streams) {
        yield await load(stream)
    }
}