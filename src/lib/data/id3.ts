export type BrokenFrame = {
    size: number;
}

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
    data: any;
}

export type ID3 = {
    version: [number, number];
    unsync: boolean;
    tagSize: number;
    fileName: string;
    xheader: boolean;
    xindicator: boolean;
    frames: Partial<Record<FrameId, Frame | Frame[]>>
}


export const FRAMES = {
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

export type FrameId = keyof typeof FRAMES

export function getFrameData<T = unknown>(id3: ID3, id: FrameId) {
    const frames = id3.frames?.[id]
    const frame: Frame | undefined = Array.isArray(frames) ? frames[0] : frames
    return frame?.data as unknown as T
}
export function title(id3: ID3) { return getFrameData<string>(id3, 'TIT2') }
export function artist(id3: ID3) { return getFrameData<string>(id3, 'TOA') }
export function album(id3: ID3) { return getFrameData<string>(id3, 'TALB') }