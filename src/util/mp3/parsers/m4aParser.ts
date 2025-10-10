/**
 * M4A/MP4 Metadata Parser
 * Extracts metadata from MP4 container files using browser APIs only.
 */

/* eslint-disable complexity -- Binary format parsing requires checking multiple conditions */
/* eslint-disable max-depth -- Nested structure matches MP4 atom hierarchy */

interface M4aMetadata {
  title?: string;
  artist?: string;
  album?: string;
  date?: string;
  genre?: string;
}

/**
 * Parse MP4 metadata atoms
 */
export function parseM4aMetadata(data: Uint8Array): M4aMetadata {
  const metadata: M4aMetadata = {};

  try {
    const decoder = new TextDecoder("utf-8");
    let offset = 0;

    // Helper to read 32-bit big-endian integer
    const readUInt32BE = (pos: number): number =>
      (data[pos] << 24) |
      (data[pos + 1] << 16) |
      (data[pos + 2] << 8) |
      data[pos + 3];

    // Helper to read atom type (4 characters)
    const readAtomType = (pos: number): string =>
      String.fromCharCode(
        data[pos],
        data[pos + 1],
        data[pos + 2],
        data[pos + 3],
      );

    // Find moov atom
    while (offset < data.length - 8) {
      const atomSize = readUInt32BE(offset);
      const atomType = readAtomType(offset + 4);

      if (atomType === "moov") {
        // Found moov atom, now look for udta/meta/ilst
        const moovEnd = offset + atomSize;
        offset += 8;

        while (offset < moovEnd - 8) {
          const innerSize = readUInt32BE(offset);
          const innerType = readAtomType(offset + 4);

          if (innerType === "udta") {
            // Found udta, look for meta
            const udtaEnd = offset + innerSize;
            offset += 8;

            while (offset < udtaEnd - 8) {
              const metaSize = readUInt32BE(offset);
              const metaType = readAtomType(offset + 4);

              if (metaType === "meta") {
                // Skip version and flags (4 bytes)
                offset += 12;
                const metaEnd = offset + metaSize - 12;

                while (offset < metaEnd - 8) {
                  const ilstSize = readUInt32BE(offset);
                  const ilstType = readAtomType(offset + 4);

                  if (ilstType === "ilst") {
                    // Parse ilst children
                    const ilstEnd = offset + ilstSize;
                    offset += 8;

                    while (offset < ilstEnd - 8) {
                      const tagSize = readUInt32BE(offset);
                      const tagType = readAtomType(offset + 4);
                      const tagEnd = offset + tagSize;
                      offset += 8;

                      // Look for data atom inside
                      if (offset + 8 < tagEnd) {
                        const dataSize = readUInt32BE(offset);
                        const dataType = readAtomType(offset + 4);

                        if (dataType === "data" && offset + 16 < tagEnd) {
                          // Skip type indicator (4 bytes) and locale (4 bytes)
                          const valueStart = offset + 16;
                          const valueEnd = offset + dataSize;
                          const value = decoder.decode(
                            data.slice(valueStart, valueEnd),
                          );

                          // Map tag types to metadata fields
                          if (tagType === "©nam") metadata.title = value;
                          else if (tagType === "©ART") metadata.artist = value;
                          else if (tagType === "©alb") metadata.album = value;
                          else if (tagType === "©day") metadata.date = value;
                          else if (tagType === "©gen") metadata.genre = value;
                        }
                      }

                      offset = tagEnd;
                    }

                    return metadata;
                  }

                  offset += ilstSize;
                }

                return metadata;
              }

              offset += metaSize;
            }

            return metadata;
          }

          offset += innerSize;
        }

        return metadata;
      }

      offset += atomSize;
    }
  } catch (e) {
    console.warn("Failed to parse M4A metadata:", e);
  }

  return metadata;
}
