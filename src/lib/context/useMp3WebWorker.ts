import { useEffect } from "preact/hooks";
import { useWorker } from "../hooks/useWorker";
import { BrokenFrame, Frame, ID3 } from "../data/id3";
import { ITypedWorker } from "typed-web-workers";

import * as idbkv from 'idb-keyval'

declare const idbKeyval: typeof idbkv


export type Mp3WebWorkerRequest = {
    event: 'load';
    handles: FileSystemFileHandle[];
}

export type Mp3WebWorkerResponse = {
    event: 'loaded';
    n: number;
    total: number;
    file: string;
    meta: ID3;
} | {
    event: 'error';
    error: string;
    n?: number;
    total?: number;
    file?: string;
} | {
    event: 'debug';
    debug: any;
    n?: number;
    total?: number;
    file?: string;
}

export type Mp3WebWorker = ITypedWorker<Mp3WebWorkerRequest, Mp3WebWorkerResponse>

async function workerFunction({ input, callback }: { input: Mp3WebWorkerRequest; callback: (payload: Mp3WebWorkerResponse) => void }) {

    // NOTE do _not_ extract any functions, because of how useWebWorker works, everything _must_
    // be contained in this functions' scope

    const FRAMES = {
        // v2.2
        "BUF": "Recommended buffer size",
        "CNT": "Play counter",
        "COM": "Comments",
        "CRA": "Audio encryption",
        "CRM": "Encrypted meta frame",
        "ETC": "Event timing codes",
        "EQU": "Equalization",
        "GEO": "General encapsulated object",
        "IPL": "Involved people list",
        "LNK": "Linked information",
        "MCI": "Music CD Identifier",
        "MLL": "MPEG location lookup table",
        "PIC": "Attached picture",
        "POP": "Popularimeter",
        "REV": "Reverb",
        "RVA": "Relative volume adjustment",
        "SLT": "Synchronized lyric/text",
        "STC": "Synced tempo codes",
        "TAL": "Album/Movie/Show title",
        "TBP": "BPM (Beats Per Minute)",
        "TCM": "Composer",
        "TCO": "Content type",
        "TCR": "Copyright message",
        "TDA": "Date",
        "TDY": "Playlist delay",
        "TEN": "Encoded by",
        "TFT": "File type",
        "TIM": "Time",
        "TKE": "Initial key",
        "TLA": "Language(s)",
        "TLE": "Length",
        "TMT": "Media type",
        "TOA": "Original artist(s)/performer(s)",
        "TOF": "Original filename",
        "TOL": "Original Lyricist(s)/text writer(s)",
        "TOR": "Original release year",
        "TOT": "Original album/Movie/Show title",
        "TP1": "Lead artist(s)/Lead performer(s)/Soloist(s)/Performing group",
        "TP2": "Band/Orchestra/Accompaniment",
        "TP3": "Conductor/Performer refinement",
        "TP4": "Interpreted, remixed, or otherwise modified by",
        "TPA": "Part of a set",
        "TPB": "Publisher",
        "TRC": "ISRC (International Standard Recording Code)",
        "TRD": "Recording dates",
        "TRK": "Track number/Position in set",
        "TSI": "Size",
        "TSS": "Software/hardware and settings used for encoding",
        "TT1": "Content group description",
        "TT2": "Title/Songname/Content description",
        "TT3": "Subtitle/Description refinement",
        "TXT": "Lyricist/text writer",
        "TXX": "User defined text information frame",
        "TYE": "Year",
        "UFI": "Unique file identifier",
        "ULT": "Unsychronized lyric/text transcription",
        "WAF": "Official audio file webpage",
        "WAR": "Official artist/performer webpage",
        "WAS": "Official audio source webpage",
        "WCM": "Commercial information",
        "WCP": "Copyright/Legal information",
        "WPB": "Publishers official webpage",
        "WXX": "User defined URL link frame",
        // v2.3
        "AENC": "Audio encryption",
        "APIC": "Attached picture",
        "COMM": "Comments",
        "COMR": "Commercial frame",
        "ENCR": "Encryption method registration",
        "EQUA": "Equalization",
        "ETCO": "Event timing codes",
        "GEOB": "General encapsulated object",
        "GRID": "Group identification registration",
        "IPLS": "Involved people list",
        "LINK": "Linked information",
        "MCDI": "Music CD identifier",
        "MLLT": "MPEG location lookup table",
        "OWNE": "Ownership frame",
        "PRIV": "Private frame",
        "PCNT": "Play counter",
        "POPM": "Popularimeter",
        "POSS": "Position synchronisation frame",
        "RBUF": "Recommended buffer size",
        "RVAD": "Relative volume adjustment",
        "RVRB": "Reverb",
        "SYLT": "Synchronized lyric/text",
        "SYTC": "Synchronized tempo codes",
        "TALB": "Album/Movie/Show title",
        "TBPM": "BPM (beats per minute)",
        "TCOM": "Composer",
        "TCON": "Content type",
        "TCOP": "Copyright message",
        "TDAT": "Date",
        "TDLY": "Playlist delay",
        "TENC": "Encoded by",
        "TEXT": "Lyricist/Text writer",
        "TFLT": "File type",
        "TIME": "Time",
        "TIT1": "Content group description",
        "TIT2": "Title/songname/content description",
        "TIT3": "Subtitle/Description refinement",
        "TKEY": "Initial key",
        "TLAN": "Language(s)",
        "TLEN": "Length",
        "TMED": "Media type",
        "TOAL": "Original album/movie/show title",
        "TOFN": "Original filename",
        "TOLY": "Original lyricist(s)/text writer(s)",
        "TOPE": "Original artist(s)/performer(s)",
        "TORY": "Original release year",
        "TOWN": "File owner/licensee",
        "TPE1": "Lead performer(s)/Soloist(s)",
        "TPE2": "Band/orchestra/accompaniment",
        "TPE3": "Conductor/performer refinement",
        "TPE4": "Interpreted, remixed, or otherwise modified by",
        "TPOS": "Part of a set",
        "TPUB": "Publisher",
        "TRCK": "Track number/Position in set",
        "TRDA": "Recording dates",
        "TRSN": "Internet radio station name",
        "TRSO": "Internet radio station owner",
        "TSIZ": "Size",
        "TSRC": "ISRC (international standard recording code)",
        "TSSE": "Software/Hardware and settings used for encoding",
        "TYER": "Year",
        "TXXX": "User defined text information frame",
        "UFID": "Unique file identifier",
        "USER": "Terms of use",
        "USLT": "Unsychronized lyric/text transcription",
        "WCOM": "Commercial information",
        "WCOP": "Copyright/Legal information",
        "WOAF": "Official audio file webpage",
        "WOAR": "Official artist/performer webpage",
        "WOAS": "Official audio source webpage",
        "WORS": "Official internet radio station homepage",
        "WPAY": "Payment",
        "WPUB": "Publishers official webpage",
        "WXXX": "User defined URL link frame"
    };

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

    function readFrame(view: DataView, id3: Omit<ID3, "fileName">, offsetParam: number): BrokenFrame | Frame {
        const major = id3.version[0]
        let offset = offsetParam

        const id = asciiDecoder.decode(view.buffer.slice(view.byteOffset + offset, view.byteOffset + offset + (major === 2 ? 3 : 4)))
        offset += major === 2 ? 3 : 4

        const size = major === 2
            ? getInt24(view, offset, false)
            : major === 3
                ? view.getUint32(offset + 4, false)
                : readTagSize(view, offset)

        if (id[0] === "\u0000") return { size } as BrokenFrame

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
            description: FRAMES[id as keyof typeof FRAMES] ?? 'unknown'
        }

        const data = readFrameData(view, frame, offset)

        return { ...frame, data }
    }

    function isFrameOk(f: BrokenFrame | Frame): f is Frame {
        return !!(f as any).id
    }

    function readFrames(view: DataView, id3: Omit<ID3, "fileName">, offset: number) {
        const major = id3.version[0]
        const frames: Record<string, any> = Object.create(null)
        const frameHeaderSize = major === 2 ? 6 : 10

        while (offset < id3.tagSize) {
            const frame = readFrame(view, id3, offset)

            if (isFrameOk(frame)) {
                if (frame.id in frames) {
                    frames[frame.id] = [frames[frame.id]]
                    frames[frame.id].push(frame)
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

        const id3: Omit<ID3, 'fileName'> = {
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


    async function loadOne({ handle, n, total }: { handle: FileSystemFileHandle, n: number, total: number }) {
        try {
            const file = await handle.getFile()
            const [s1, s2] = file.stream().tee()
            const meta1 = await readMeta(s1)
            const meta = { ...meta1, fileName: handle.name } as ID3
            const data = await readAll(s2)

            await idbKeyval.set(`track:${handle.name}`, { ...meta, data })

            callback({ event: 'loaded', meta, n, total, file: handle.name })
        } catch (e) {
            callback({ event: 'error', file: handle.name, error: String(e), n, total })
        }
    }


    async function load({ handles }: { handles: FileSystemFileHandle[] }) {
        let n = 0
        const total = handles.length
        const promises: Promise<void>[] = []

        for (const handle of handles) {
            n++
            promises.push(loadOne({ handle, n, total }))
        }

        await Promise.allSettled(promises)
    }

    switch (input.event) {
        case 'load': load(input); break;
        default: callback({ event: 'error', error: "Unhandled " + JSON.stringify(input) })
    }
}

const globalListeners: (((resp: Mp3WebWorkerResponse) => void)[]) = []

export function useMp3WebWorker(onMessage: (resp: Mp3WebWorkerResponse) => void) {
    useEffect(() => {
        globalListeners.push(onMessage)
        return () => {
            const idx = globalListeners.indexOf(onMessage)
            if (idx >= 0) globalListeners.splice(idx, 1)
        }
    }, [])

    return useWorker<Mp3WebWorkerRequest, Mp3WebWorkerResponse>("mp3", {
        onMessage: (resp) => globalListeners.forEach(l => l(resp)),
        onError: (err) => console.error(err),
        workerFunction,
        importScripts: ['node_modules/idb-keyval/dist/idb-keyval-iife.min.js']
    })
}
