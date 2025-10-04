// mostly informed by https://raw.githubusercontent.com/entropia/tip-toi-reveng/master/GME-Format.md
/* eslint-disable max-lines -- TODO refactor into more chunks */
/* eslint-disable complexity -- really not so complex */

import type { Track } from "../mp3/track";
import { id } from "tsafe";
import { concatStreams } from "../concatStreams";
import { singleChunkStream } from "../singleChunkStream";
import { concatBuffers } from "../concatBuffers";

interface ScriptValue {
  value: number;
}
interface ScriptRegister {
  register: number;
}
type ScriptParameter = ScriptValue | ScriptRegister;

function isRegister(x: unknown): x is ScriptRegister {
  return x !== null && typeof x === "object" && "register" in x;
}

function toHex(num: number) {
  const hex = num.toString(16).padStart(4, "0");
  return `${hex.slice(2, 4)} ${hex.slice(0, 2)}`;
}

const scriptConditionOps = {
  "==": 0xfff9,
  ">": 0xfffa,
  "<": 0xfffb,
  ">=": 0xfffd,
  "<=": 0xfffe,
  "!=": 0xffff,
};

const commands = {
  inc: 0xfff0, // FFF0 (written $r+=m): increment register $r by m or value of $m
  dec: 0xfff1, // FFF1 (written $r-=m): decrement register $r by m or value of $m
  mul: 0xfff2, // FFF2 (written $r*=m): multiply register $r by m or value of $m
  mod: 0xfff3, // FFF3 (written $r%=m): set register $r to $r mod m
  div: 0xfff4, // FFF4 (written $r/=m): set register $r to $r div m
  and: 0xfff5, // FFF5 (written $r&=m): bitwise and to register $r the value of m
  or: 0xfff6, // FFF6 (written $r|=m): bitwise or to register $r the value of m
  xor: 0xfff7, // FFF7 (written $r^=m): bitwise xor to register $r the value of m
  neg: 0xfff8, // FFF8 (written Neg($r)): negate register $r.
  set: 0xfff9, // FFF9 (written $r:=m): set register $r to m or value of $m
  playAny: 0xffe0, // FFE0 (written P*(): play one random sample of the media list
  playAll: 0xffe1, // FFE1 (written PA*(): play all samples of the media list
  play: 0xffe8, // FFE8 (written P(m)): play audio referenced by the mth entry in the indices list.
  playAllRange: 0xfb00, // FB00 (written PA(b-a)): play all samples from that inclusive range. a := lowbyte(m), b := highbyte(m)
  playAnyRange: 0xfc00, // FC00 (written P(b-a)): play one random sample from that inclusive range. a := lowbyte(m), b := highbyte(m)
  game: 0xfd00, // FD00 (written G(m)): begin game m.
  jump: 0xf8ff, // F8FF (written J(m)): jump to script m.
  cancel: 0xfaff, // FAFF (written C): cancel game mode.
  timer: 0xff00, // FF00 (written T($register,123)): Timer action.
};

interface ScriptCondition {
  lhs: ScriptParameter;
  op: keyof typeof scriptConditionOps;
  rhs: ScriptParameter;
}

interface ScriptAction {
  cmd: keyof typeof commands;
  register?: number;
  param: ScriptParameter;
}

interface ScriptLine {
  conditions: ScriptCondition[];
  actions: ScriptAction[];
  playlist: number[];
}

export interface GmeBuildConfig {
  productId: number;
  tracks: Track[];
  language: "GERMAN" | "DUTCH" | "FRENCH" | "ITALIAN" | "RUSSIAN" | "ENGLISH";
  comment?: string;
  initialRegisterValues?: number[];
  scripts?: Record<number, ScriptLine[]>;
  replayOid?: number;
  stopOid?: number;
  powerOnSounds?: number[];
}

export type Req = {
  event: "build";
  writablePort: MessagePort;
  projectUuid?: string;
} & GmeBuildConfig;

interface Buf {
  readonly buf: ArrayBuffer;
  readonly view: DataView;
  readonly uint8: Uint8Array;
}
export type MediaItemFetcher = (
  item: MediaTableItem,
) => Promise<ReadableStream<Uint8Array>>;

const utf8enc = new TextEncoder();

type WriteStringOpt =
  | object
  | { lengthPrefix: boolean }
  | { nullTerminated: boolean };

function writeString(
  { view, uint8 }: Buf,
  pos: number,
  val: string,
  opt: WriteStringOpt = {},
) {
  const nullTerminated = "nullTerminated" in opt ? opt.nullTerminated : false;
  const lengthPrefix = "lengthPrefix" in opt ? opt.lengthPrefix : true;
  if (nullTerminated && lengthPrefix) {
    throw new Error("lengthPrefix and nullTerminated cannot both be true");
  }
  const enc = utf8enc.encode(val);
  if (lengthPrefix) view.setUint8(pos, enc.byteLength);
  uint8.set(enc, pos + (lengthPrefix ? 1 : 0));
  if (nullTerminated) view.setUint8(pos + enc.byteLength + 1, 0x0);
}

interface LayoutItem {
  write: (buf: Buf) => void;
}

export interface ScriptTableItem {
  offset: number;
  scriptOffset: number;
  script: ScriptLine[] | undefined;
  encoded: Uint8Array | undefined;
}

export interface MediaTableItem extends LayoutItem {
  offset: number;
  mediaOffset: number;
  track: Track;
}

export function isReq(x: unknown): x is Req {
  return x != null && typeof x === "object" && "event" in x;
}

// https://github.com/entropia/tip-toi-reveng/blob/45129a3c6a024c5166e950b4004f665e65d4ca19/testsuite/expected/example.info.txt#L3
const magicXorValue = 0xad;
const rawXorValue = 0x39;

function createSpecialCodesTable({
  offset,
  replayOid,
  stopOid,
}: {
  offset: number;
  replayOid: number;
  stopOid: number;
}) {
  /**
   * This consists of 40 bytes. It contains all the OIDs that have a
   * special meaning/function in the book.
   * Example from Puzzle Ponyhof:
   * a: OID for the Replay symbol
   * b: OID for the Stop symbol
   * c: unknown, seems to be the OID for Skip symbol (needs to be confirmed)
   * d: unknown
   * e: unknown (in this example: OID for game mode)
   * p: unknown, padding? reserved? unused?
   * f: unknown, 0 or 1 (always 1 for g != 0, but can also be 1 for g = 0)
   * g: unknown, (in this example: discover mode)
   */
  const example = `
          #             68 18 00 00 67 18 64 18 65 18 00 00
                        aa aa bb bb cc cc dd dd ee ee pp pp
          # 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
            pp pp pp pp pp pp pp pp pp pp pp pp pp pp pp pp
          # 00 00 00 00 00 00 00 00 01 00 66 18
            pp pp pp pp pp pp pp pp ff ff gg gg 
  `;
  const data = example
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length !== 0 && !s.startsWith("#"))
    .join("\n")
    .replace("aa aa", toHex(replayOid))
    .replace("bb bb", toHex(stopOid))
    .replace("cc cc", "00 00")
    .replace("dd dd", "00 00")
    .replace("ee ee", "00 00")
    .replace("ff ff", "00 00")
    .replace("gg gg", "00 00")
    .replaceAll("pp", "00")
    .split(/\s+/)
    .filter((s) => s.length)
    .map((s) => parseInt(s, 16));
  return {
    size: data.length,
    write(buf: Buf) {
      buf.uint8.set(data, offset);
    },
  };
}
function createGameTable({ offset }: { offset: number }) {
  // https://github.com/entropia/tip-toi-reveng/wiki/GME-Game-Table
  const data = `
            0c 00 00 00 71 70 01 00  35 7a 01 00 91 7f 01 00
            00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00
            cd 82 01 00 59 8a 01 00  e7 8e 01 00 4f 97 01 00 
            00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00
            0f 9f 01 00 c7 9f 01 00  69 a1 01 00 69 ad 01 00 
            00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00
            fb b2 01 00 
            00 00 00 00
            `
    .split(/\s+/)
    .filter((s) => s.length)
    .map((s) => parseInt(s, 16));
  return {
    size: data.length,
    write(buf: Buf) {
      buf.uint8.set(data, offset);
    },
  };
}

function createMediaTable({
  tracks,
  offset,
}: {
  offset: number;
  tracks: Track[];
}) {
  const size = 8 * tracks.length;

  const { items } = tracks.reduce(
    ({ items, offset, mediaOffset }, track) => ({
      offset: offset + 8,
      mediaOffset: mediaOffset + track.size,
      items: [
        ...items,
        id<MediaTableItem>({
          offset,
          mediaOffset,
          write({ view }) {
            view.setUint32(this.offset, this.mediaOffset, true);
            view.setUint32(this.offset + 4, this.track.size, true);
          },
          track,
        }),
      ],
    }),
    { offset, items: id<MediaTableItem[]>([]), mediaOffset: offset + size },
  );

  return {
    items,
    size,
    write(buf: Buf) {
      for (const item of items) item.write(buf);
    },
  };
}

function encodeScriptLine(line: ScriptLine) {
  const size =
    3 * 2 +
    line.conditions.length * 8 +
    line.actions.length * 7 +
    line.playlist.length * 2;

  const b = new ArrayBuffer(size);
  const v = new DataView(b);

  let offset = 0;
  v.setUint16(0, line.conditions.length, true);
  offset += 2;

  for (const condition of line.conditions) {
    v.setUint8(offset, isRegister(condition.lhs) ? 0x00 : 0x01);
    v.setUint16(
      offset + 1,
      isRegister(condition.lhs) ? condition.lhs.register : condition.lhs.value,
      true,
    );
    v.setUint16(offset + 3, scriptConditionOps[condition.op], true);
    v.setUint8(offset + 5, isRegister(condition.rhs) ? 0x00 : 0x01);
    v.setUint16(
      offset + 6,
      isRegister(condition.rhs) ? condition.rhs.register : condition.rhs.value,
      true,
    );

    offset += 8;
  }

  v.setUint16(offset, line.actions.length, true);
  offset += 2;

  for (const action of line.actions) {
    v.setUint16(offset, action.register ?? 0, true);
    v.setUint16(offset + 2, commands[action.cmd], true);
    v.setUint8(offset + 4, isRegister(action.param) ? 0x00 : 0x01);
    v.setUint16(
      offset + 5,
      isRegister(action.param) ? action.param.register : action.param.value,
      true,
    );

    offset += 7;
  }

  v.setUint16(offset, line.playlist.length, true);
  offset += 2;
  for (const item of line.playlist) {
    v.setUint16(offset, item, true);
    offset += 2;
  }

  return new Uint8Array(b);
}

function encodeScript(
  lines: ScriptLine[] | undefined,
  scriptOffsetArg: number,
) {
  if (lines == null || lines.length === 0) return undefined;

  const encodedLines = lines.map(encodeScriptLine);

  const size = 2 + 4 * lines.length;
  const b = new ArrayBuffer(size);
  const v = new DataView(b);
  v.setUint16(0, lines.length, true);

  let offset = 2;
  let scriptOffset = scriptOffsetArg + size;

  for (const line of encodedLines) {
    v.setUint32(offset, scriptOffset, true);
    offset += 2;
    scriptOffset += line.byteLength;
  }

  return concatBuffers(...[new Uint8Array(b), ...encodedLines]);
}

function createAlbumControls(tracks?: Track[]): Record<number, ScriptLine[]> {
  if (typeof tracks === "undefined" || tracks.length === 0) return { 1401: [] };

  const oid = 1401;
  const zero = { value: 0 };
  const conditions: ScriptLine["conditions"] = [
    { lhs: zero, op: "==", rhs: zero },
  ];
  const actions: ScriptLine["actions"] = [
    { register: 0, cmd: "play", param: zero },
  ];

  return Object.fromEntries(
    tracks.map((_, i) => {
      const lines: ScriptLine[] = [{ conditions, actions, playlist: [i] }];
      return [oid + i, lines];
    }),
  );
}

function createScriptTable({
  offset,
  scripts: cfgScripts,
  tracks,
}: {
  scripts?: Record<number, ScriptLine[]>;
  offset: number;
  tracks?: Track[];
}) {
  const scripts = cfgScripts ?? createAlbumControls(tracks);
  const headSize = 4 + 4 + 4 * Object.keys(scripts).length;
  const firstOid = Math.min(...Object.keys(scripts).map(Number));
  const lastOid = Math.max(...Object.keys(scripts).map(Number));
  const seq = new Array(lastOid - firstOid + 1)
    .fill(0)
    .map((_, i) => i + firstOid);

  const { items, size } = seq.reduce(
    ({ items, offset, scriptOffset, size }, oid) => {
      const encoded = encodeScript(scripts[oid], scriptOffset);
      return {
        offset: offset + 4,
        size: size + (encoded?.byteLength ?? 0),
        scriptOffset: scriptOffset + (encoded?.byteLength ?? 0),
        items: [
          ...items,
          id<ScriptTableItem>({
            encoded,
            script: scripts[oid],
            offset,
            scriptOffset: oid in scripts ? scriptOffset : 0xffff_ffff,
          }),
        ],
      };
    },
    {
      size: headSize,
      offset: offset + 8,
      items: id<ScriptTableItem[]>([]),
      scriptOffset: offset + headSize,
    },
  );
  return {
    size,
    write({ uint8, view }: Buf) {
      view.setUint16(offset, lastOid, true);
      view.setUint16(offset + 4, firstOid, true);
      for (const item of items) {
        view.setUint32(item.offset, item.scriptOffset, true);
      }
      for (const item of items) {
        if (item.encoded != null) uint8.set(item.encoded, item.scriptOffset);
      }
    },
  };
}

function createInitialRegisterValues({
  offset,
  initialRegisterValues: cfgInitialRegisterValues,
}: {
  initialRegisterValues?: number[];
  offset: number;
}) {
  const initialRegisterValues: number[] = cfgInitialRegisterValues ?? [];
  const size = 2 + 2 * initialRegisterValues.length;
  return {
    size,
    write({ view }: Buf) {
      view.setUint16(offset, initialRegisterValues.length, true);
      for (let index = 0; index < initialRegisterValues.length; index++) {
        view.setUint16(offset + index * 2, initialRegisterValues[index], true);
      }
    },
  };
}

function createHeader({
  comment: cfgComment,
  language: lang,
  productId,
}: Omit<GmeBuildConfig, "tracks">) {
  const comment =
    cfgComment ?? "CHOMPTECH DATA FORMAT CopyRight 2009 Ver2.1.2222";
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

  if (comment.length > 48) {
    throw new Error(
      `Comment must not be longer than 48 chars: ${comment}(${comment.length} chars)`,
    );
  }
  if (date.length !== 8) {
    throw new Error(
      `Date must have an length of _exactly_ 8 characters: ${date}`,
    );
  }

  const items = {
    // 32bit offset to the play script table
    scriptTableOffset: id<LayoutItem & { val: number }>({
      val: 0x0200,
      write({ view }) {
        view.setUint32(0x0000, this.val, true);
      },
    }),
    // 32bit offset to the *media file table*
    mediaTableOffset: id<LayoutItem & { val: number }>({
      val: 0,
      write({ view }) {
        view.setUint32(0x0004, this.val, true);
      },
    }),
    // 32bit. If you change this value in a working game file it will no longer be accepted. Its value is 0x0000238b for all tiptoi products seen so far. Maybe this is the Ravensburger customer number at Chomptech.
    magicNumber: id<LayoutItem>({
      write({ view }) {
        view.setUint32(0x0008, 0x0000238b, true);
      },
    }),
    // 32bit. The offset to an *additional script table*. Purpose unknown.
    additionalScriptTableOffset: id<LayoutItem & { val: number }>({
      val: 0,
      write({ view }) {
        view.setUint32(0x000c, this.val, true);
      },
    }),
    // 32bit. The offset to the *game table*
    gameTableOffset: id<LayoutItem & { val: number }>({
      val: 0,
      write({ view }) {
        view.setUint32(0x0010, this.val, true);
      },
    }),
    // 32bit. Product id code (== OID code of the power on symbol on page 1)
    productIdCode: id<LayoutItem>({
      write({ view }) {
        view.setUint32(0x0014, productId, true);
      },
    }),
    // 32bit. Pointer to register init values (16bit counter followed by n*16bit values. First value is register $0, followed by $1 and so on.)
    initialRegisterValuesOffset: id<LayoutItem & { val: number }>({
      val: 0,
      write({ view }) {
        view.setUint32(0x0018, this.val, true);
      },
    }),
    // raw XOR value (8bit), see below at media table explanation.
    rawXorValue: id<LayoutItem>({
      write({ view }) {
        view.setUint8(0x001c, rawXorValue);
      },
    }),
    // a variable length string, consisting of its length (8bit), and that many characters. Commonly `CHOMPTECH DATA FORMAT CopyRight 2009 Ver2.xx.yyyy` (varies between products, xx can also be one digit only)
    copyright: id<LayoutItem>({
      write(buf) {
        writeString(buf, 0x0020, comment);
      },
    }),
    date: id<LayoutItem>({
      write(buf) {
        writeString(buf, 0x0020 + comment.length + 1, date, {
          lengthPrefix: false,
        });
      },
    }),
    lang: id<LayoutItem>({
      write(buf) {
        writeString(
          buf,
          0x0020 + comment.length + 8 + 1,
          lang.substring(0, 6),
          { lengthPrefix: false, nullTerminated: true },
        );
      },
    }),
    additionalMediaOffset: id<LayoutItem>({
      write({ view }) {
        view.setUint32(0x0060, 0xffff_ffff, true);
      },
    }),
    // 32bit offset to the playlistlist for the the power-on sound (played, when the product is recognized. If 0, no sound is played.)
    powerOnSoundOffset: id<LayoutItem & { val: number }>({
      val: 0,
      write({ view }) {
        view.setUint32(0x0071, this.val, true);
      },
    }),
    //  32bit offset to the *special OID list*
    specialCodesOffset: id<LayoutItem & { val: number }>({
      val: 0,
      write({ view }) {
        view.setUint32(0x0094, this.val, true);
      },
    }),
    /**
     *  The following entries might exist only from Version 2.10.0901
     *
     * 0x008C: 32bit offset purpose unknown. Some products have 0 here. It seems that this offset points to a list of <number of mediafiles> 32bit values (0 or 1), the *media flag table*. The meaning of those flags is unknown.
     * 0x0090: 32bit offset to the *game binaries table* (probably the games for the ZC3201)
     * 0x0098: 32bit offset to an *additional game binaries table* (probably the games for the ZC3202N)
     * 0x009C: 32bit. purpose unknown, can be 0.
     * 0x00A0: 32bit offset to a game binaries table, which consists of a single binary (probably the main binary for the ZC3201)
     * 0x00A4: 32bit flag, can be 0 or 1 (0 means the rest of the header is filled with 0; 1 means the rest of the header contains one or more of the following offsets)
     * 0x00A8: 32bit offset to another game binaries table, which also consists of a single binary (probably the main binary for the ZC3202N)
     * 0x00C8: 32bit offset to an *additional* game binaries table with a single binary (probably the main  binary for the ZC3203L)
     * 0x00CC: 32bit offset to another *additional* game binaries table (probably the games for the ZC3203L)
     */
  };
  return {
    items,
    write(buf: Buf) {
      for (const item of Object.values(items)) item.write(buf);
    },
  };
}

// FIXME allow multiple playlists
function createPoweronSoundPlaylistList({
  offset,
  trackIndices = [],
}: {
  trackIndices?: number[];
  offset: number;
}) {
  if (trackIndices.length === 0) {
    return {
      size: 2,
      write(buf: Buf) {
        buf.view.setUint16(offset, 0);
      },
    };
  }

  // Playlist structure:
  // - 2 bytes: number of playlists (1 in this case)
  // - 4 bytes: offset to first playlist
  // - playlist:
  //   - 2 bytes: number of tracks
  //   - 2 bytes per track: track index
  const playlistSize = 2 + trackIndices.length * 2;
  const size = 2 + 4 + playlistSize;

  return {
    size,
    write(buf: Buf) {
      // Number of playlists
      buf.view.setUint16(offset, 1, true);
      // Offset to first playlist
      buf.view.setUint32(offset + 2, offset + 6, true);
      // Number of tracks in playlist
      buf.view.setUint16(offset + 6, trackIndices.length, true);
      // Track indices
      for (let i = 0; i < trackIndices.length; i++) {
        buf.view.setUint16(offset + 8 + i * 2, trackIndices[i], true);
      }
    },
  };
}

export function createLayout({ tracks, ...cfg }: GmeBuildConfig) {
  const header = createHeader(cfg);

  const { replayOid = 12159, stopOid = 12158 } = cfg;

  let offset = (header.items.scriptTableOffset.val = 0x0200);

  const scriptTable = createScriptTable({
    scripts: cfg.scripts,
    offset,
    tracks,
  });

  offset = header.items.initialRegisterValuesOffset.val =
    offset + scriptTable.size;
  const initialRegisterValues = createInitialRegisterValues({
    offset,
    initialRegisterValues: cfg.initialRegisterValues,
  });

  offset = header.items.powerOnSoundOffset.val =
    offset + initialRegisterValues.size;
  const powerOnSoundPlayListList = createPoweronSoundPlaylistList({
    offset,
    trackIndices: cfg.powerOnSounds,
  });

  offset = header.items.additionalScriptTableOffset.val =
    offset + powerOnSoundPlayListList.size;
  const additionalScripts = createScriptTable({
    scripts: { 0x3000: [] },
    offset,
  });

  offset = header.items.gameTableOffset.val = offset + additionalScripts.size;
  const gameTable = createGameTable({ offset });

  offset = header.items.specialCodesOffset.val = offset + gameTable.size;
  const specialCodes = createSpecialCodesTable({ offset, replayOid, stopOid });

  offset = header.items.mediaTableOffset.val = offset + specialCodes.size;
  const mediaTable = createMediaTable({ tracks, offset });

  offset = offset + mediaTable.size;

  return {
    size: offset,
    mediaTable,
    write(buf: Buf) {
      header.write(buf);
      scriptTable.write(buf);
      initialRegisterValues.write(buf);
      powerOnSoundPlayListList.write(buf);
      specialCodes.write(buf);
      mediaTable.write(buf);
    },
  };
}

function alloc(size: number) {
  const buf = new ArrayBuffer(size);
  const view = new DataView(buf);
  const uint8 = new Uint8Array(buf);
  return { buf, view, uint8 };
}

function checksum() {
  let sum = 0;
  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      for (const b of chunk) sum += b;
    },
    flush(controller) {
      const b = new ArrayBuffer(4);
      const v = new DataView(b);
      v.setUint32(0, sum, true);
      controller.enqueue(new Uint8Array(b));
      controller.terminate();
    },
  });
}

function mediaFileCypher(x: number) {
  const y = x ^ 0xff;
  return new TransformStream<Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(
        chunk.map((n) => {
          switch (n) {
            case 0:
            case 0xff:
            case x:
            case y:
              return n;
            default:
              return x ^ n;
          }
        }),
      );
    },
  });
}

export function build(
  config: Parameters<typeof createLayout>[0],
  getMediaFn: MediaItemFetcher,
) {
  async function* streams(): AsyncGenerator<ReadableStream<Uint8Array>> {
    const layout = createLayout(config);

    const buf = alloc(layout.size);
    layout.write(buf);
    yield singleChunkStream(buf.uint8);

    for (const media of layout.mediaTable.items) {
      const data = await getMediaFn(media);
      yield data.pipeThrough(mediaFileCypher(magicXorValue));
    }
  }

  return concatStreams(streams()).pipeThrough(checksum());
}
