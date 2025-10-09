/**
 * WAV Metadata Parser
 * Extracts INFO chunk metadata from WAV files using browser APIs only.
 */

/* eslint-disable complexity -- Binary format parsing requires checking multiple conditions */
/* eslint-disable max-depth -- Nested structure matches RIFF chunk hierarchy */

interface WavMetadata {
  title?: string;
  artist?: string;
  album?: string;
  date?: string;
  genre?: string;
}

/**
 * Parse WAV RIFF INFO chunks
 */
export function parseWavMetadata(data: Uint8Array): WavMetadata {
  const metadata: WavMetadata = {};

  try {
    // WAV file structure:
    // - "RIFF" (4 bytes)
    // - File size - 8 (4 bytes, little-endian)
    // - "WAVE" (4 bytes)
    // - Chunks...

    if (
      data.length < 12 ||
      data[0] !== 0x52 || // 'R'
      data[1] !== 0x49 || // 'I'
      data[2] !== 0x46 || // 'F'
      data[3] !== 0x46 // 'F'
    ) {
      return metadata;
    }

    if (
      data[8] !== 0x57 || // 'W'
      data[9] !== 0x41 || // 'A'
      data[10] !== 0x56 || // 'V'
      data[11] !== 0x45 // 'E'
    ) {
      return metadata;
    }

    const decoder = new TextDecoder("latin1");
    let offset = 12;

    // Helper to read 32-bit little-endian integer
    const readUInt32LE = (pos: number): number =>
      data[pos] |
      (data[pos + 1] << 8) |
      (data[pos + 2] << 16) |
      (data[pos + 3] << 24);

    // Helper to read chunk ID (4 characters)
    const readChunkId = (pos: number): string =>
      String.fromCharCode(
        data[pos],
        data[pos + 1],
        data[pos + 2],
        data[pos + 3],
      );

    // Read chunks
    while (offset < data.length - 8) {
      const chunkId = readChunkId(offset);
      const chunkSize = readUInt32LE(offset + 4);
      offset += 8;

      if (chunkId === "LIST") {
        const listType = readChunkId(offset);
        offset += 4;

        if (listType === "INFO") {
          const listEnd = offset + chunkSize - 4;

          while (offset < listEnd - 8) {
            const infoId = readChunkId(offset);
            const infoSize = readUInt32LE(offset + 4);
            offset += 8;

            if (offset + infoSize > data.length) break;

            const value = decoder
              .decode(data.slice(offset, offset + infoSize))
              .replace(/\0/g, "")
              .trim();

            if (infoId === "INAM") metadata.title = value;
            else if (infoId === "IART") metadata.artist = value;
            else if (infoId === "IPRD") metadata.album = value;
            else if (infoId === "ICRD") metadata.date = value;
            else if (infoId === "IGNR") metadata.genre = value;

            offset += infoSize;

            // Align to 2-byte boundary
            if (infoSize % 2 !== 0) offset++;
          }

          break;
        } else {
          offset += chunkSize - 4;
        }
      } else {
        offset += chunkSize;
      }

      // Align to 2-byte boundary
      if (chunkSize % 2 !== 0) offset++;
    }
  } catch (e) {
    console.warn("Failed to parse WAV metadata:", e);
  }

  return metadata;
}
