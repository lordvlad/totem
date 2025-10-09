import { load as loadId3 } from "./id3";
import type { ID3 } from "./id3";

export type AudioMetadata = Omit<ID3, "fileName"> & {
  data: Uint8Array;
  size: number;
};

/**
 * Extract metadata from an audio file stream.
 * Supports MP3 (ID3), OGG (Vorbis), M4A/AAC, FLAC, and WAV formats.
 *
 * Note: For non-MP3 formats, metadata extraction is not currently supported
 * in the browser environment. These files will use the filename as the title.
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

  // For other formats, read the raw data without metadata extraction
  return await loadRawAudio(stream);
}

/**
 * Load audio file without metadata extraction.
 * Returns raw audio data with empty metadata structure.
 */
async function loadRawAudio(
  stream: ReadableStream<Uint8Array>,
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

  // Return empty metadata structure
  // The Track class will use the filename as the title (fallback behavior)
  return {
    version: [4, 0],
    unsync: false,
    tagSize: 0,
    xheader: false,
    xindicator: false,
    frames: {},
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
