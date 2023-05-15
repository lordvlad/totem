// mostly informed by https://raw.githubusercontent.com/entropia/tip-toi-reveng/master/GME-Format.md

import { type Track } from "../library/track";
import { id } from "tsafe"
import { concat } from "../util/concat";
import { singleChunkStream } from "../util/singleChunkStream";

type Script = {
    oid: number;
    lines?: string[];
}

export type GmeBuildConfig = {
    productId: number;
    tracks: Track[];
    language: "GERMAN" | "DUTCH" | "FRENCH" | "ITALIAN" | "RUSSIAN" | "ENGLISH";
    comment?: string;
    initialRegisterValues?: number[];
    scripts?: Script[];
};

export type Req = {
    event: "build";
    writablePort: MessagePort,
} & GmeBuildConfig

type Buf = {
    readonly buf: ArrayBuffer,
    readonly view: DataView,
    readonly uint8: Uint8Array,
}
export type MediaItemFetcher = (item: MediaTableItem) => Promise<ReadableStream<Uint8Array>>

const utf8enc = new TextEncoder()

function writeString({ view, uint8 }: Buf, pos: number, val: string, { lengthPrefix = true, nullTerminated = false }: { lengthPrefix?: boolean; nullTerminated?: boolean } = {}) {
    if (nullTerminated && lengthPrefix) throw new Error("lengthPrefix and nullTerminated can not both be true")
    const enc = utf8enc.encode(val)
    if (lengthPrefix) view.setUint8(pos, enc.byteLength)
    uint8.set(enc, pos + (lengthPrefix ? 1 : 0))
    if (nullTerminated) view.setUint8(pos + enc.byteLength + 1, 0x0)
}

interface LayoutItem { write(buf: Buf): void; }

export interface ScriptTableItem extends LayoutItem {
    offset: number;
    scriptOffset: number;
    script: Script;
}

export interface MediaTableItem extends LayoutItem {
    offset: number;
    mediaOffset: number;
    track: Track;
}

export function isReq(x: any): x is Req {
    return x != null && typeof x === "object" && "event" in x
}

// https://github.com/entropia/tip-toi-reveng/blob/45129a3c6a024c5166e950b4004f665e65d4ca19/testsuite/expected/example.info.txt#L3
const magicXorValue = 0xad
const rawXorValue = 0x39

function createGameTable({ offset }: { offset: number; }) {
    // https://github.com/entropia/tip-toi-reveng/wiki/GME-Game-Table
    const data = Buffer.from(`
            0c 00 00 00 71 70 01 00  35 7a 01 00 91 7f 01 00
            00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00
            cd 82 01 00 59 8a 01 00  e7 8e 01 00 4f 97 01 00 
            00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00
            0f 9f 01 00 c7 9f 01 00  69 a1 01 00 69 ad 01 00 
            00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00
            fb b2 01 00 
            00 00 00 00
            `.split(/\s+/).filter(s => s.length).map(s => parseInt(s, 16)))
    return {
        size: data.byteLength,
        write(buf: Buf) {
            buf.uint8.set(data, offset)
        }
    }
}

function createMediaTable({ tracks, offset }: { offset: number; tracks: Track[] }) {
    const size = 8 * tracks.length

    const { items } = tracks.reduce(({ items, offset, mediaOffset }, track) => {
        return {
            offset: offset + 8,
            mediaOffset: mediaOffset + track.size,
            items: [...items, id<MediaTableItem>({
                offset,
                mediaOffset,
                write({ view }) {
                    view.setUint32(this.offset, this.mediaOffset, true);
                    view.setUint32(this.offset + 4, this.track.size, true);
                },
                track
            })],
        }
    }, { offset, items: id<MediaTableItem[]>([]), mediaOffset: offset + size })

    return { items, size, write(buf: Buf) { for (const item of items) item.write(buf); } }
}

function createScriptTable({ offset, scripts: cfgScripts }: { scripts?: Script[]; offset: number; }) {
    const scripts: Script[] = cfgScripts ?? [{ oid: 1401 }]
    const size = 4 + 4 + (4 * scripts.length)
    const firstOid = Math.min(...scripts.map(s => s.oid))
    const lastOid = Math.max(...scripts.map(s => s.oid))

    const { items } = scripts.reduce(({ items, offset, scriptOffset }, script) => {
        return {
            offset: offset + 4,
            scriptOffset: scriptOffset + 0 /* FIXME */,
            items: [...items, id<ScriptTableItem>({
                script,
                offset,
                scriptOffset: script.lines ? scriptOffset : 0xffff_ffff,
                write({ view }) {
                    view.setUint32(this.offset, this.scriptOffset, true);
                },
            })]
        }

    }, { offset: offset + 8, items: id<ScriptTableItem[]>([]), scriptOffset: offset + size })
    return {
        size,
        write(buf: Buf) {
            buf.view.setUint32(offset, firstOid, true)
            buf.view.setUint32(offset + 4, lastOid, true)
            for (const item of items) item.write(buf);
        }
    }
}

function createInitialRegisterValues({ offset, initialRegisterValues: cfgInitialRegisterValues }: { initialRegisterValues?: number[]; offset: number; }) {
    const initialRegisterValues: number[] = cfgInitialRegisterValues ?? [];
    const size = 2 + (2 * initialRegisterValues.length)
    return {
        size,
        write({ view }: Buf) {
            view.setUint16(offset, initialRegisterValues.length, true)
            for (let index = 0; index < initialRegisterValues.length; index++) view.setUint16(offset + index * 2, initialRegisterValues[index], true)
        },
    }

}

function createHeader({ comment: cfgComment, language: lang, productId }: Omit<GmeBuildConfig, 'tracks'>) {
    const comment = cfgComment ?? "CHOMPTECH DATA FORMAT CopyRight 2009 Ver2.1.2222"
    const d = new Date()
    const date = `${d.getFullYear()}${String(d.getMonth()).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

    if (comment.length > 48) throw new Error(`Comment must not be longer than 48 chars: ${comment}(${comment.length} chars)`)
    if (date.length !== 8) throw new Error(`Date must have an length of _exactly_ 8 characters: ${date}`)

    const items = {
        // 32bit offset to the play script table
        scriptTableOffset: id<LayoutItem & { val: number; }>({
            val: 0x0200,
            write({ view }) { view.setUint32(0x0000, this.val, true) },
        }),
        // 32bit offset to the *media file table*
        mediaTableOffset: id<LayoutItem & { val: number; }>({
            val: 0,
            write({ view }) { view.setUint32(0x0004, this.val, true) },
        }),
        // 32bit. If you change this value in a working game file it will no longer be accepted. Its value is 0x0000238b for all tiptoi products seen so far. Maybe this is the Ravensburger customer number at Chomptech. 
        magicNumber: id<LayoutItem>({
            write({ view }) { view.setUint32(0x0008, 0x0000238b, true) }
        }),
        // 32bit. The offset to an *additional script table*. Purpose unknown.
        additionalScriptTableOffset: id<LayoutItem & { val: number; }>({
            val: 0,
            write({ view }) { view.setUint32(0x000c, this.val, true) }
        }),
        // 32bit. The offset to the *game table*
        gameTableOffset: id<LayoutItem & { val: number; }>({
            val: 0,
            write({ view }) { view.setUint32(0x0010, this.val, true) }
        }),
        // 32bit. Product id code (== OID code of the power on symbol on page 1)
        productIdCode: id<LayoutItem>({
            write({ view }) { view.setUint32(0x0014, productId, true) }
        }),
        // 32bit. Pointer to register init values (16bit counter followed by n*16bit values. First value is register $0, followed by $1 and so on.)
        initialRegisterValuesOffset: id<LayoutItem & { val: number; }>({
            val: 0,
            write({ view }) {
                view.setUint32(0x0018, this.val, true)
            }
        }),
        // raw XOR value (8bit), see below at media table explanation.
        rawXorValue: id<LayoutItem>({
            write({ view }) { view.setUint8(0x001C, rawXorValue) },
        }),
        // a variable length string, consisting of its length (8bit), and that many characters. Commonly `CHOMPTECH DATA FORMAT CopyRight 2009 Ver2.xx.yyyy` (varies between products, xx can also be one digit only)
        copyright: id<LayoutItem>({
            write(buf) { writeString(buf, 0x0020, comment) },
        }),
        date: id<LayoutItem>({
            write(buf) { writeString(buf, 0x0020 + comment.length + 1, date, { lengthPrefix: false }) }
        }),
        lang: id<LayoutItem>({
            write(buf) { writeString(buf, 0x0020 + comment.length + 8 + 1, lang.substring(0, 6), { lengthPrefix: false, nullTerminated: true }) }
        }),
        additionalMediaOffset: id<LayoutItem>({
            write({ view }) { view.setUint32(0x0060, 0xffff_ffff, true) }
        }),
        // 32bit offset to the playlistlist for the the power-on sound (played, when the product is recognized. If 0, no sound is played.)
        powerOnSoundOffset: id<LayoutItem & { val: number }>({
            val: 0,
            write({ view }) { view.setUint32(0x0071, this.val, true) }
        }),
        /**
         *  The following entries might exist only from Version 2.10.0901
         * 
         * 0x008C: 32bit offset purpose unknown. Some products have 0 here. It seems that this offset points to a list of <number of mediafiles> 32bit values (0 or 1), the *media flag table*. The meaning of those flags is unknown.
         * 0x0090: 32bit offset to the *game binaries table* (probably the games for the ZC3201)
         * 0x0094: 32bit offset to the *special OID list*
         * 0x0098: 32bit offset to an *additional game binaries table* (probably the games for the ZC3202N)
         * 0x009C: 32bit. purpose unknown, can be 0.
         * 0x00A0: 32bit offset to a game binaries table, which consists of a single binary (probably the main binary for the ZC3201)
         * 0x00A4: 32bit flag, can be 0 or 1 (0 means the rest of the header is filled with 0; 1 means the rest of the header contains one or more of the following offsets)
         * 0x00A8: 32bit offset to another game binaries table, which also consists of a single binary (probably the main binary for the ZC3202N)
         * 0x00C8: 32bit offset to an *additional* game binaries table with a single binary (probably the main  binary for the ZC3203L)
         * 0x00CC: 32bit offset to another *additional* game binaries table (probably the games for the ZC3203L)
         */
    }
    return {
        items,
        write(buf: Buf) {
            for (const item of Object.values(items)) item.write(buf)
        }
    }
}
// FIXME allow multiple playlists
function createPoweronSoundPlaylistList({ trackIndex, offset }: { trackIndex: number; offset: number }) {
    return {
        size: 2,
        write(buf: Buf) {
            buf.view.setUint16(offset, 0)
            // buf.view.setUint32(offset + 2, offset + 6)
            // buf.view.setUint16(offset + 6, 1)
            // buf.view.setUint16(offset + 8, trackIndex)
        }
    }
}

export function createLayout({ tracks, ...cfg }: GmeBuildConfig) {
    const header = createHeader(cfg)

    let offset = header.items.scriptTableOffset.val = 0x0200

    const scriptTable = createScriptTable({ scripts: cfg.scripts, offset })

    offset = header.items.initialRegisterValuesOffset.val = offset + scriptTable.size
    const initialRegisterValues = createInitialRegisterValues({ offset, initialRegisterValues: cfg.initialRegisterValues })

    offset = header.items.powerOnSoundOffset.val = offset + initialRegisterValues.size
    const powerOnSoundPlayListList = createPoweronSoundPlaylistList({ offset, trackIndex: 0 })

    offset = header.items.additionalScriptTableOffset.val = offset + powerOnSoundPlayListList.size
    const additionalScripts = createScriptTable({ scripts: [{ oid: 0x3000 }], offset })

    offset = header.items.gameTableOffset.val = offset + additionalScripts.size
    const gameTable = createGameTable({ offset })

    offset = header.items.mediaTableOffset.val = offset + gameTable.size
    const mediaTable = createMediaTable({ tracks, offset })

    offset = offset + mediaTable.size

    return {
        size: offset,
        mediaTable,
        write(buf: Buf) {
            header.write(buf)
            scriptTable.write(buf)
            initialRegisterValues.write(buf)
            powerOnSoundPlayListList.write(buf)
            mediaTable.write(buf)
        }
    }
}

function alloc(size: number) {
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf)
    const uint8 = new Uint8Array(buf)
    return { buf, view, uint8 }
}

function checksum() {
    let sum = 0;
    return new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
            controller.enqueue(chunk)
            for (const b of chunk) sum += b
        },
        flush(controller) {
            const b = new ArrayBuffer(4)
            const v = new DataView(b)
            v.setUint32(0, sum, true)
            controller.enqueue(new Uint8Array(b))
            controller.terminate()
        }
    })
}


function mediaFileCypher(x: number) {
    const y = x ^ 0xff
    return new TransformStream<Uint8Array>({
        transform(chunk, controller) {
            controller.enqueue(chunk.map(n => {
                switch (n) {
                    case 0:
                    case 0xff:
                    case x:
                    case y: return n;
                    default: return x ^ n;
                }
            }))
        }
    })
}

export function build(config: Parameters<typeof createLayout>[0], getMediaFn: MediaItemFetcher) {
    async function* streams(): AsyncGenerator<ReadableStream<Uint8Array>> {
        const layout = createLayout(config);

        const buf = alloc(layout.size)
        layout.write(buf)
        yield singleChunkStream(buf.uint8)

        for (const media of layout.mediaTable.items) {
            const data = await getMediaFn(media)
            yield data.pipeThrough(mediaFileCypher(magicXorValue))
        }
    }

    return concat(streams()).pipeThrough(checksum())
}

