import { load as loadId3 } from "./id3";
import type { ID3 } from "./id3";
import { parseOggMetadata } from "./parsers/oggParser";
import { parseFlacMetadata } from "./parsers/flacParser";
import { parseM4aMetadata } from "./parsers/m4aParser";
import { parseWavMetadata } from "./parsers/wavParser";

export type AudioMetadata = Omit<ID3, "fileName"> & {
  data: Uint8Array;
  size: number;
};

/**
 * Extract metadata from an audio file stream.
 * Supports MP3 (ID3), OGG (Vorbis), M4A/AAC, FLAC, and WAV formats.
 *
 * Metadata is extracted using browser-compatible parsers:
 * - MP3: ID3 tags
 * - OGG: Vorbis comments
 * - FLAC: Vorbis comments in metadata blocks
 * - M4A/AAC: MP4 metadata atoms
 * - WAV: RIFF INFO chunks
 */
export async function loadAudioMetadata(
  stream: ReadableStream<Uint8Array>,
  fileName: string,
): Promise<AudioMetadata> {
  const fileExtension = fileName.toLowerCase().split(".").pop() ?? "";

  // For MP3 files, use the optimized ID3 parser
  if (fileExtension === "mp3") {
    return await loadId3(stream);
  }

  // For other formats, parse format-specific metadata
  return await loadWithMetadata(stream, fileExtension);
}

/**
 * Load audio file with format-specific metadata extraction.
 * Returns audio data with extracted metadata in ID3-compatible format.
 */
// eslint-disable-next-line complexity -- Metadata conversion requires checking multiple fields
async function loadWithMetadata(
  stream: ReadableStream<Uint8Array>,
  fileExtension: string,
): Promise<AudioMetadata> {
  // Read the entire stream into a buffer
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const data = concatBuffers(...chunks);

  // Parse metadata based on file format
  let parsedMetadata: {
    title?: string;
    artist?: string;
    album?: string;
    date?: string;
    genre?: string;
  } = {};

  if (fileExtension === "ogg" || fileExtension === "oga") {
    parsedMetadata = parseOggMetadata(data);
  } else if (fileExtension === "flac") {
    parsedMetadata = parseFlacMetadata(data);
  } else if (fileExtension === "m4a" || fileExtension === "aac") {
    parsedMetadata = parseM4aMetadata(data);
  } else if (fileExtension === "wav") {
    parsedMetadata = parseWavMetadata(data);
  }

  // Convert to ID3-compatible frame structure
  const frames: ID3["frames"] = {};

  if (
    typeof parsedMetadata.title === "string" &&
    parsedMetadata.title.length > 0
  ) {
    frames.TIT2 = {
      id: "TIT2",
      size: 0,
      flags: null,
      frameDataSize: null,
      description: "Title",
      data: parsedMetadata.title,
    };
  }

  if (
    typeof parsedMetadata.artist === "string" &&
    parsedMetadata.artist.length > 0
  ) {
    frames.TOA = {
      id: "TOA",
      size: 0,
      flags: null,
      frameDataSize: null,
      description: "Artist",
      data: parsedMetadata.artist,
    };
  }

  if (
    typeof parsedMetadata.album === "string" &&
    parsedMetadata.album.length > 0
  ) {
    frames.TALB = {
      id: "TALB",
      size: 0,
      flags: null,
      frameDataSize: null,
      description: "Album",
      data: parsedMetadata.album,
    };
  }

  if (
    typeof parsedMetadata.date === "string" &&
    parsedMetadata.date.length > 0
  ) {
    frames.TYER = {
      id: "TYER",
      size: 0,
      flags: null,
      frameDataSize: null,
      description: "Year",
      data: parsedMetadata.date,
    };
  }

  if (
    typeof parsedMetadata.genre === "string" &&
    parsedMetadata.genre.length > 0
  ) {
    frames.TCON = {
      id: "TCON",
      size: 0,
      flags: null,
      frameDataSize: null,
      description: "Genre",
      data: parsedMetadata.genre,
    };
  }

  return {
    version: [4, 0],
    unsync: false,
    tagSize: 0,
    xheader: false,
    xindicator: false,
    frames,
    data,
    size: data.byteLength,
  };
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}
