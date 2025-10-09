/**
 * FLAC Metadata Parser
 * Extracts Vorbis comments from FLAC files using browser APIs only.
 */

/* eslint-disable complexity -- Binary format parsing requires checking multiple conditions */
/* eslint-disable max-depth -- Nested structure matches FLAC metadata block format */

interface FlacMetadata {
  title?: string;
  artist?: string;
  album?: string;
  date?: string;
  genre?: string;
}

/**
 * Parse FLAC metadata blocks
 */
export function parseFlacMetadata(data: Uint8Array): FlacMetadata {
  const metadata: FlacMetadata = {};

  try {
    // FLAC file structure:
    // - "fLaC" marker (4 bytes)
    // - Metadata blocks

    if (
      data.length < 4 ||
      data[0] !== 0x66 || // 'f'
      data[1] !== 0x4c || // 'L'
      data[2] !== 0x61 || // 'a'
      data[3] !== 0x43 // 'C'
    ) {
      return metadata;
    }

    let offset = 4;
    const decoder = new TextDecoder("utf-8");

    // Read metadata blocks
    while (offset < data.length) {
      const blockHeader = data[offset];
      const isLast = (blockHeader & 0x80) !== 0;
      const blockType = blockHeader & 0x7f;
      offset++;

      // Read block length (24-bit big-endian)
      const blockLength =
        (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
      offset += 3;

      // Block type 4 is VORBIS_COMMENT
      if (blockType === 4) {
        // Parse vendor string
        const vendorLength =
          data[offset] |
          (data[offset + 1] << 8) |
          (data[offset + 2] << 16) |
          (data[offset + 3] << 24);
        offset += 4 + vendorLength;

        // Parse user comment list
        const commentCount =
          data[offset] |
          (data[offset + 1] << 8) |
          (data[offset + 2] << 16) |
          (data[offset + 3] << 24);
        offset += 4;

        for (let i = 0; i < commentCount; i++) {
          if (offset + 4 > data.length) break;

          const commentLength =
            data[offset] |
            (data[offset + 1] << 8) |
            (data[offset + 2] << 16) |
            (data[offset + 3] << 24);
          offset += 4;

          if (offset + commentLength > data.length) break;

          const commentStr = decoder.decode(
            data.slice(offset, offset + commentLength),
          );
          offset += commentLength;

          const eqIndex = commentStr.indexOf("=");
          if (eqIndex > 0) {
            const key = commentStr.slice(0, eqIndex).toUpperCase();
            const value = commentStr.slice(eqIndex + 1);

            if (key === "TITLE") metadata.title = value;
            else if (key === "ARTIST") metadata.artist = value;
            else if (key === "ALBUM") metadata.album = value;
            else if (key === "DATE") metadata.date = value;
            else if (key === "GENRE") metadata.genre = value;
          }
        }

        break;
      }

      offset += blockLength;

      if (isLast) break;
    }
  } catch (e) {
    console.warn("Failed to parse FLAC metadata:", e);
  }

  return metadata;
}
