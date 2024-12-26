import { concatBuffers } from '../concatBuffers'

const asciiDecoder = new TextDecoder('ascii')
const utf8Decoder = new TextDecoder('utf8')
const utf16Decoder = new TextDecoder('utf-16')
const utf16BEDecoder = new TextDecoder('utf-16be')
const latinDecoder = new TextDecoder('latin1')

export interface BrokenFrame {
  size: number
}

export interface Frame {
  id: FrameId
  size: number
  flags: null | {
    message: {
      tag_alter_preservation: boolean
      file_alter_preservation: boolean
      read_only: boolean
    }
    format: {
      grouping_identity: boolean
      compression: boolean
      encryption: boolean
      unsync: boolean
      data_length_indicator: boolean
    }
  }
  frameDataSize: number | null
  description: string
  data: any
}

export interface ID3 {
  version: [2 | 3 | 4, number]
  unsync: boolean
  tagSize: number
  fileName: string
  xheader: boolean
  xindicator: boolean
  frames: Partial<Record<FrameId, Frame | Frame[]>>
}

export const FRAMES = {
  // v2.2
  BUF: 'Recommended buffer size',
  CNT: 'Play counter',
  COM: 'Comments',
  CRA: 'Audio encryption',
  CRM: 'Encrypted meta frame',
  ETC: 'Event timing codes',
  EQU: 'Equalization',
  GEO: 'General encapsulated object',
  IPL: 'Involved people list',
  LNK: 'Linked information',
  MCI: 'Music CD Identifier',
  MLL: 'MPEG location lookup table',
  PIC: 'Attached picture',
  POP: 'Popularimeter',
  REV: 'Reverb',
  RVA: 'Relative volume adjustment',
  SLT: 'Synchronized lyric/text',
  STC: 'Synced tempo codes',
  TAL: 'Album/Movie/Show title',
  TBP: 'BPM (Beats Per Minute)',
  TCM: 'Composer',
  TCO: 'Content type',
  TCR: 'Copyright message',
  TDA: 'Date',
  TDY: 'Playlist delay',
  TEN: 'Encoded by',
  TFT: 'File type',
  TIM: 'Time',
  TKE: 'Initial key',
  TLA: 'Language(s)',
  TLE: 'Length',
  TMT: 'Media type',
  TOA: 'Original artist(s)/performer(s)',
  TOF: 'Original filename',
  TOL: 'Original Lyricist(s)/text writer(s)',
  TOR: 'Original release year',
  TOT: 'Original album/Movie/Show title',
  TP1: 'Lead artist(s)/Lead performer(s)/Soloist(s)/Performing group',
  TP2: 'Band/Orchestra/Accompaniment',
  TP3: 'Conductor/Performer refinement',
  TP4: 'Interpreted, remixed, or otherwise modified by',
  TPA: 'Part of a set',
  TPB: 'Publisher',
  TRC: 'ISRC (International Standard Recording Code)',
  TRD: 'Recording dates',
  TRK: 'Track number/Position in set',
  TSI: 'Size',
  TSS: 'Software/hardware and settings used for encoding',
  TT1: 'Content group description',
  TT2: 'Title/Songname/Content description',
  TT3: 'Subtitle/Description refinement',
  TXT: 'Lyricist/text writer',
  TXX: 'User defined text information frame',
  TYE: 'Year',
  UFI: 'Unique file identifier',
  ULT: 'Unsychronized lyric/text transcription',
  WAF: 'Official audio file webpage',
  WAR: 'Official artist/performer webpage',
  WAS: 'Official audio source webpage',
  WCM: 'Commercial information',
  WCP: 'Copyright/Legal information',
  WPB: 'Publishers official webpage',
  WXX: 'User defined URL link frame',
  // v2.3
  AENC: 'Audio encryption',
  APIC: 'Attached picture',
  COMM: 'Comments',
  COMR: 'Commercial frame',
  ENCR: 'Encryption method registration',
  EQUA: 'Equalization',
  ETCO: 'Event timing codes',
  GEOB: 'General encapsulated object',
  GRID: 'Group identification registration',
  IPLS: 'Involved people list',
  LINK: 'Linked information',
  MCDI: 'Music CD identifier',
  MLLT: 'MPEG location lookup table',
  OWNE: 'Ownership frame',
  PRIV: 'Private frame',
  PCNT: 'Play counter',
  POPM: 'Popularimeter',
  POSS: 'Position synchronisation frame',
  RBUF: 'Recommended buffer size',
  RVAD: 'Relative volume adjustment',
  RVRB: 'Reverb',
  SYLT: 'Synchronized lyric/text',
  SYTC: 'Synchronized tempo codes',
  TALB: 'Album/Movie/Show title',
  TBPM: 'BPM (beats per minute)',
  TCOM: 'Composer',
  TCON: 'Content type',
  TCOP: 'Copyright message',
  TDAT: 'Date',
  TDLY: 'Playlist delay',
  TENC: 'Encoded by',
  TEXT: 'Lyricist/Text writer',
  TFLT: 'File type',
  TIME: 'Time',
  TIT1: 'Content group description',
  TIT2: 'Title/songname/content description',
  TIT3: 'Subtitle/Description refinement',
  TKEY: 'Initial key',
  TLAN: 'Language(s)',
  TLEN: 'Length',
  TMED: 'Media type',
  TOAL: 'Original album/movie/show title',
  TOFN: 'Original filename',
  TOLY: 'Original lyricist(s)/text writer(s)',
  TOPE: 'Original artist(s)/performer(s)',
  TORY: 'Original release year',
  TOWN: 'File owner/licensee',
  TPE1: 'Lead performer(s)/Soloist(s)',
  TPE2: 'Band/orchestra/accompaniment',
  TPE3: 'Conductor/performer refinement',
  TPE4: 'Interpreted, remixed, or otherwise modified by',
  TPOS: 'Part of a set',
  TPUB: 'Publisher',
  TRCK: 'Track number/Position in set',
  TRDA: 'Recording dates',
  TRSN: 'Internet radio station name',
  TRSO: 'Internet radio station owner',
  TSIZ: 'Size',
  TSRC: 'ISRC (international standard recording code)',
  TSSE: 'Software/Hardware and settings used for encoding',
  TYER: 'Year',
  TXXX: 'User defined text information frame',
  UFID: 'Unique file identifier',
  USER: 'Terms of use',
  USLT: 'Unsychronized lyric/text transcription',
  WCOM: 'Commercial information',
  WCOP: 'Copyright/Legal information',
  WOAF: 'Official audio file webpage',
  WOAR: 'Official artist/performer webpage',
  WOAS: 'Official audio source webpage',
  WORS: 'Official internet radio station homepage',
  WPAY: 'Payment',
  WPUB: 'Publishers official webpage',
  WXXX: 'User defined URL link frame'
}

const PICTURE_TYPE = [
  "32x32 pixels 'file icon' (PNG only)",
  'Other file icon',
  'Cover (front)',
  'Cover (back)',
  'Leaflet page',
  'Media (e.g. lable side of CD)',
  'Lead artist/lead performer/soloist',
  'Artist/performer',
  'Conductor',
  'Band/Orchestra',
  'Composer',
  'Lyricist/text writer',
  'Recording Location',
  'During recording',
  'During performance',
  'Movie/video screen capture',
  'A bright coloured fish',
  'Illustration',
  'Band/artist logotype',
  'Publisher/Studio logotype'
] as const

export type FrameId = keyof typeof FRAMES

export function getFrameData<T = unknown>(id3: ID3, id: FrameId) {
  const frames = id3.frames?.[id]
  const frame: Frame | undefined = Array.isArray(frames) ? frames[0] : frames
  return frame?.data as unknown as T
}
export function title(id3: ID3) { return getFrameData<string>(id3, 'TIT2') }
export function artist(id3: ID3) { return getFrameData<string>(id3, 'TOA') }
export function album(id3: ID3) { return getFrameData<string>(id3, 'TALB') }

function isBitSetAt(buf: DataView, offset: number, bit: number) {
  return (buf.getUint8(offset) & (1 << bit)) !== 0
}

function readTagSize(view: DataView, off: number) {
  const b1 = view.getUint8(off)!
  const b2 = view.getUint8(off + 1)!
  const b3 = view.getUint8(off + 2)!
  const b4 = view.getUint8(off + 3)!

  return (b4 & 0x7f) |
    ((b3 & 0x7f) << 7) |
    ((b2 & 0x7f) << 14) |
    ((b1 & 0x7f) << 21)
}

function getInt24(view: DataView, offset: number, littleEndian?: boolean) {
  return littleEndian
    ? view.getUint8(offset) | (view.getUint8(offset + 1) << 8) | (view.getUint8(offset + 2) << 16)
    : view.getUint8(offset + 2) | (view.getUint8(offset + 1) << 8) | (view.getUint8(offset) << 16)
}

function readFrameFlags(view: DataView, offset: number) {
  return {
    message: {
      tag_alter_preservation: isBitSetAt(view, offset, 6),
      file_alter_preservation: isBitSetAt(view, offset, 5),
      read_only: isBitSetAt(view, offset, 4)
    },
    format: {
      grouping_identity: isBitSetAt(view, offset + 1, 7),
      compression: isBitSetAt(view, offset + 1, 3),
      encryption: isBitSetAt(view, offset + 1, 2),
      unsync: isBitSetAt(view, offset + 1, 1),
      data_length_indicator: isBitSetAt(view, offset + 1, 0)
    }
  }
}

function getTextDecoder(view: DataView, offset: number) {
  const b = view.getUint8(offset)
  switch (b) {
    case 0x00: return latinDecoder // iso-8859-1
    case 0x01: return utf16Decoder
    case 0x02: return utf16BEDecoder
    default: return utf8Decoder
  }
}

function readPictureFrame(view: DataView, offsetParam: number, length: number, version: [2 | 3 | 4, number]) {
  const decoder = getTextDecoder(view, offsetParam)

  const mimetype = (() => {
    switch (version[0]) {
      case 2: return decodeText(view, offsetParam + 1, 3, decoder)
      case 3:
      case 4: return readNullTerminatedText(view, offsetParam + 1, decoder)
    }
  })()
  let offset = offsetParam + 1 + bytelegth(mimetype)
  const bite = view.getUint8(offset)
  const type = PICTURE_TYPE[bite]
  const description = readNullTerminatedText(view, offset + 1, decoder)
  offset += 2 + bytelegth(description)

  return { mimetype, type, description, data: view.buffer.slice(offset, offsetParam + length) }
};

export type ID3Art = ReturnType<typeof readPictureFrame>

function readNullTerminatedText(view: DataView, offset: number, decoder: TextDecoder) {
  const begin = view.byteOffset + offset
  const end = view.byteLength
  let i = begin
  while (i < end && view.getUint8(i) !== 0) i++
  return decoder.decode(view.buffer.slice(begin, i) as AllowSharedBufferSource)
}

function readFrameData(view: DataView, frame: Omit<Frame, 'data'>, offsetParam: number, version: [2 | 3 | 4, number]) {
  let offset = offsetParam
  const size = frame.frameDataSize ?? frame.size

  // text frames
  if (frame.id[0] === 'T') {
    const decoder = getTextDecoder(view, offset)
    offset += 1
    const begin = view.byteOffset + offset
    const text = decodeText(view, begin, size, decoder)

    switch (frame.id) {
      case 'TCO':
      case 'TCON':
        return text.replace(/^\(\d+\)/, '')
      default:
        return text
    }
  }

  // other frames
  switch (frame.id) {
    case 'APIC': {
      return readPictureFrame(view, offset, size, version)
    }
  }

  return null
}

function decodeText(view: DataView, begin: number, size: number, decoder: TextDecoder) {
  const slice = view.buffer.slice(begin, begin + size - 1)
  const text = decoder.decode((
    new Uint8Array(slice).at(-1) === 0
      ? slice.slice(0, slice.byteLength - 1)
      : slice) as AllowSharedBufferSource)
  return text
}

function isFrameId(s: string): s is FrameId {
  return s in FRAMES
}

function readFrame(view: DataView, id3: Omit<ID3, 'fileName' | 'frames'>, offsetParam: number): BrokenFrame | Frame {
  const major = id3.version[0]
  let offset = offsetParam

  const id = asciiDecoder.decode(
    view.buffer.slice(view.byteOffset + offset, view.byteOffset + offset + (major === 2 ? 3 : 4)) as AllowSharedBufferSource)
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

  const data = readFrameData(view, frame, offset, id3.version)

  return { ...frame, data }
}

function isFrameOk(f: BrokenFrame | Frame): f is Frame {
  return !!(f as any).id
}

function readFrames(view: DataView, id3: Omit<ID3, 'fileName' | 'frames'>, offset: number) {
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

async function readTags(stream: ReadableStreamDefaultReader<Uint8Array>): Promise<Omit<ID3, 'fileName'>> {
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
  })()

  const buf = await getBuffer(10)

  if (asciiDecoder.decode(buf.slice(0, 3)) !== 'ID3') throw new Error('No ID3 tag found')

  const view = new DataView(buf)

  const major = view.getUint8(3)! as 2 | 3 | 4
  const minor = view.getUint8(4)!

  const id3: Omit<ID3, 'fileName' | 'frames'> = {
    version: [major, minor],
    unsync: isBitSetAt(view, 5, 7),
    xheader: isBitSetAt(view, 5, 6),
    xindicator: isBitSetAt(view, 5, 5),
    tagSize: readTagSize(view, 6)
  }

  const offset = id3.xheader ? (view.getUint32(10, false) + 4) : 0

  const frames = readFrames(view, id3, offset + 10)

  return { ...id3, frames }
}

async function readAll(stream: ReadableStream<Uint8Array>) {
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
  try {
    reader = stream.getReader()
    const chunks: Uint8Array[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    return concatBuffers(...chunks)
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

export async function* loadAll(...streams: Array<ReadableStream<Uint8Array>>) {
  for (const stream of streams) {
    yield await load(stream)
  }
}

function bytelegth(format: string) {
  return new TextEncoder().encode(format).length
}
