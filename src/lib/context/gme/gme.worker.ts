/// <reference lib="WebWorker" />

// export empty type because of tsc --isolatedModules flag
export type { };
declare const self: WorkerGlobalScope;

import { fromWritablePort } from "remote-web-streams";
import { type WritableStream } from "whatwg-streams";
import { type Req, type GmeBuildConfig } from "./data"
import { type Track } from "../../data/track";
import { get } from "idb-keyval";


type Buf = {
    readonly buf: ArrayBuffer,
    readonly view: DataView,
    readonly uint8: Uint8Array,
}

const utf8enc = new TextEncoder()

const dataTypes = {
    uint32: ({ view }: Buf, pos: number, val: number) => view.setUint32(pos, val, true),
    uint8: ({ view }: Buf, pos: number, val: number) => view.setUint8(pos, val),
    str_uint8: ({ view, uint8 }: Buf, pos: number, val: string) => {
        view.setUint8(pos, val.length)
        uint8.set(utf8enc.encode(val), pos + 1)
    }
} as const

class ScriptLine {

}


// taken from https://raw.githubusercontent.com/entropia/tip-toi-reveng/master/GME-Format.md

function createMediaTable({ tracks, offset }: { offset: number; tracks: Track[] }) {
    const size = 8 * tracks.length

    type Tmp = {
        desc: string;
        pos: number;
        val: [number, number];
        track: Track;
        type: ({ view }: Buf, pos: number, val: [number, number]) => void;
    }

    const { items } = tracks.reduce(({ items, offset, mediaOffset }, track) => {
        return {
            offset: offset + 8,
            mediaOffset: mediaOffset + track.size,
            items: [...items, {
                desc: `${track.fileName} offset & size`,
                pos: offset,
                val: [mediaOffset, track.size] as [number, number],
                type: ({ view }: Buf, pos: number, val: [number, number]) => {
                    view.setUint32(pos, val[0], true);
                    view.setUint32(pos, val[1], true);
                },
                track
            }],
        }

    }, {
        items: [] as Tmp[],
        offset,
        mediaOffset: offset + size,
    })

    return { items, size, offset }
}


function createLayout({ lang, tracks, productId }: GmeBuildConfig) {

    const magicXorValue = 0xAD // https://github.com/entropia/tip-toi-reveng/blob/45129a3c6a024c5166e950b4004f665e65d4ca19/testsuite/expected/example.info.txt#L3
    const rawXorValue = 0x00000039 // https://github.com/entropia/tip-toi-reveng/blob/45129a3c6a024c5166e950b4004f665e65d4ca19/testsuite/expected/example.info.txt#LL2C16-L2C26

    const header = {
        items: {
            scriptTableOffset: {
                desc: "32bit offset to the play script table",
                type: dataTypes.uint32,
                pos: 0x0000,
                val: 0,
            },
            mediaFileTableOffset: {
                desc: "32bit offset to the *media file table*",
                type: dataTypes.uint32,
                pos: 0x0004,
                val: 0,
            },
            magicNumber: {
                desc: "32bit. If you change this value in a working game file it will no longer be accepted. Its value is 0x0000238b for all tiptoi products seen so far. Maybe this is the Ravensburger customer number at Chomptech. ",
                type: dataTypes.uint32,
                pos: 0x0008,
                val: 0x0000238b,
            },
            additionalScriptTableOffset: {
                desc: "32bit. The offset to an *additional script table*. Purpose unknown.",
                type: dataTypes.uint32,
                pos: 0x000c,
                val: 0,
            },
            gameTableOffset: {
                desc: "32bit. The offset to the *game table*",
                type: dataTypes.uint32,
                pos: 0x0010,
                val: 0,
            },
            productIdCode: {
                desc: "32bit. Product id code (== OID code of the power on symbol on page 1)",
                type: dataTypes.uint32,
                pos: 0x0014,
                val: productId,
            },
            registerInitValuesOffset: {
                desc: "32bit. Pointer to register init values (16bit counter followed by n*16bit values. First value is register $0, followed by $1 and so on.)",
                type: dataTypes.uint32,
                pos: 0x0018,
                val: 0,
            },
            rawXorValue: {
                desc: "raw XOR value (8bit), see below at media table explanation.",
                type: dataTypes.uint8,
                pos: 0x001C,
                val: rawXorValue,
            },
            copyright: {
                desc: "a variable length string, consisting of its length (8bit), and that many characters. Commonly `CHOMPTECH DATA FORMAT CopyRight 2009 Ver2.xx.yyyy` (varies between products, xx can also be one digit only)",
                type: dataTypes.str_uint8,
                pos: 0x0020,
                val: "CHOMPTECH DATA FORMAT CopyRight 2009 Ver2.11.2222"
            },
            // The spec says that both date and lang are optional, so lets skip them to keep things simple
            //
            // Next is a 8 date string (20111024). The date string seems optional with one condition: if a language string follows the date must consist of at least one ASCII number.
            // Next is an optional language string (currently known: GERMAN, DUTCH, FRENCH, ITALIAN, RUSSIA. If the language string is provided it must match the language of the firmware that is running on the pen (it is unclear where it is checked; the file .tiptoi.log is NOT taken into account here!) or the pen will ignore it. If the language is missing any TipToi pen will accept the file. In the YAML file, this can be set using, for example, gme-lang: FRENCH
            additionalMediaOffset: {
                desc: "32bit offset to an *additional media file table*",
                pos: 0x0060,
                type: dataTypes.uint32,
                val: 0
            },
            powerOnSoundOffset: {
                desc: "32bit offset to the playlistlist for the the power-on sound (played, when the product is recognized. If 0, no sound is played.)",
                pos: 0x0071,
                type: dataTypes.uint32,
                val: 0,
            },
            /**
             *  The following entries might exist only from Version 2.10.0901
             */
            // `0x008C`: 32bit offset purpose unknown. Some products have 0 here. It seems that this offset points to a list of <number of mediafiles> 32bit values (0 or 1), the *media flag table*. The meaning of those flags is unknown.
            gameBinariesTableOffset: {
                desc: "32bit offset to the *game binaries table* (probably the games for the ZC3201)",
                pos: 0x0090,
                val: 0,
                type: dataTypes.uint32,
            },
            specialOidList: {
                desc: "32bit offset to the *special OID list*",
                pos: 0x0094,
                val: 0,
                type: dataTypes.uint32,
            },
            /*
             * `0x0098`: 32bit offset to an *additional game binaries table* (probably the games for the ZC3202N)
             * `0x009C`: 32bit. purpose unknown, can be 0.
             * `0x00A0`: 32bit offset to a game binaries table, which consists of a single binary (probably the main binary for the ZC3201)
             * `0x00A4`: 32bit flag, can be 0 or 1 (0 means the rest of the header is filled with 0; 1 means the rest of the header contains one or more of the following offsets)
             * `0x00A8`: 32bit offset to another game binaries table, which also consists of a single binary (probably the main binary for the ZC3202N)
             * `0x00C8`: 32bit offset to an *additional* game binaries table with a single binary (probably the main  binary for the ZC3203L)
             * `0x00CC`: 32bit offset to another *additional* game binaries table (probably the games for the ZC3203L)
             */

        },
        pos: 0x0000,
        size: 0x01ff,
        end: 0x01ff,
    }

    // TODO script table

    // FIXME make this depend scripts table size
    header.items.mediaFileTableOffset.val = 0x0300;
    const media = createMediaTable({ tracks, offset: header.items.mediaFileTableOffset.val })

    const layout = {
        header: header.items,
        media: media.items,
        size: media.offset + media.size
    }


    console.log("LAYOUT", { header, media })
    console.log("LAYOUT", layout)
    return layout

}

function byteLen(s: string) { return utf8enc.encode(s).length }


async function build(config: Parameters<typeof createLayout>[0], stream: WritableStream<Uint8Array>) {
    const { size, header, media } = createLayout(config);
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf)
    const uint8 = new Uint8Array(buf)


    const headerItems = Object.values(header)
    headerItems.sort((a, b) => a.pos - b.pos)

    for (const { pos, val, type } of headerItems) (type as Function)({ view, buf, uint8 }, pos, val);
    for (const { pos, val, type } of media) (type as Function)({ view, buf, uint8 }, pos, val);

    const writer = stream.getWriter()
    writer.write(uint8)

    for (const { track } of media) {
        const data = await get<Uint8Array>(`data:${track.fileName}`)
        if (!data) throw new Error(`Data missing for ${track.fileName}`)
        await writer.write(data)
    }

    writer.close();
}

function isReq(x: any): x is Req {
    return x != null && typeof x === "object" && "event" in x
}

self.addEventListener("error", e => console.error(e))
self.addEventListener("unhandledrejection", e => console.error(e))
self.addEventListener("message", async (event: Event) => {
    if ("data" in event && isReq(event.data)) {
        switch (event.data.event) {
            case "build":
                const { event: ev1, writablePort, ...cfg } = event.data
                try {
                    build(cfg, fromWritablePort<Uint8Array>(writablePort))
                } catch (e) {
                    postMessage({ event: "error", error: String(e) })
                }
                break
        }
    }
    else if ("isTrusted" in event) {
        console.info("isTrusted:", event.isTrusted)
    } else {
        throw new Error(`Unhandled event: ${JSON.stringify(event)}`)
    }
})



