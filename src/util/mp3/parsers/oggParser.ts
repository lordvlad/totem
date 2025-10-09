/**
 * OGG Vorbis Comment Parser
 * Extracts metadata from OGG Vorbis files using browser APIs only.
 */

/* eslint-disable complexity -- Binary format parsing requires checking multiple conditions */
/* eslint-disable max-depth -- Nested structure matches OGG container format */

interface VorbisComments {
  title?: string;
  artist?: string;
  album?: string;
  date?: string;
  genre?: string;
}

/**
 * Parse Vorbis comments from OGG file data
 */
export function parseOggMetadata(data: Uint8Array): VorbisComments {
  const comments: VorbisComments = {};

  try {
    let offset = 0;
    const decoder = new TextDecoder("utf-8");

    // Find Vorbis comment header
    while (offset < data.length - 4) {
      // Check for OggS signature
      if (
        data[offset] === 0x4f &&
        data[offset + 1] === 0x67 &&
        data[offset + 2] === 0x67 &&
        data[offset + 3] === 0x53
      ) {
        // Skip OGG page header (27 bytes minimum)
        const numSegments = data[offset + 26];
        offset += 27;

        // Skip segment table
        let pageSize = 0;
        for (let i = 0; i < numSegments; i++) {
          pageSize += data[offset++];
        }

        // Check for Vorbis comment packet (packet type 3)
        const packetStart = offset;
        if (
          offset + 7 < data.length &&
          data[offset] === 0x03 &&
          decoder.decode(data.slice(offset + 1, offset + 7)) === "vorbis"
        ) {
          offset += 7;

          // Parse vendor string length (little-endian)
          const vendorLength =
            data[offset] |
            (data[offset + 1] << 8) |
            (data[offset + 2] << 16) |
            (data[offset + 3] << 24);
          offset += 4 + vendorLength;

          // Parse user comment list length
          const commentCount =
            data[offset] |
            (data[offset + 1] << 8) |
            (data[offset + 2] << 16) |
            (data[offset + 3] << 24);
          offset += 4;

          // Parse each comment
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

            // Parse key=value format
            const eqIndex = commentStr.indexOf("=");
            if (eqIndex > 0) {
              const key = commentStr.slice(0, eqIndex).toUpperCase();
              const value = commentStr.slice(eqIndex + 1);

              if (key === "TITLE") comments.title = value;
              else if (key === "ARTIST") comments.artist = value;
              else if (key === "ALBUM") comments.album = value;
              else if (key === "DATE") comments.date = value;
              else if (key === "GENRE") comments.genre = value;
            }
          }

          break;
        }

        offset = packetStart + pageSize;
      } else {
        offset++;
      }
    }
  } catch (e) {
    // If parsing fails, return empty comments
    console.warn("Failed to parse OGG metadata:", e);
  }

  return comments;
}
