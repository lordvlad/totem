/* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- musicmetadata types are incomplete */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- musicmetadata types are incomplete */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- musicmetadata types are incomplete */
/* eslint-disable @typescript-eslint/no-unsafe-call -- musicmetadata types are incomplete */
/* eslint-disable @typescript-eslint/no-unsafe-return -- musicmetadata types are incomplete */
/* eslint-disable @typescript-eslint/no-explicit-any -- musicmetadata uses any types */
/* eslint-disable @typescript-eslint/strict-boolean-expressions -- need to handle musicmetadata's optional fields */
/* eslint-disable complexity -- metadata conversion requires checking multiple fields */
// @ts-expect-error -- musicmetadata does not have type definitions
import musicmetadata from "musicmetadata";
import { load as loadId3 } from "./id3";
import type { ID3 } from "./id3";

export type AudioMetadata = Omit<ID3, "fileName"> & {
  data: Uint8Array;
  size: number;
};

interface MusicMetadata {
  title?: string;
  artist?: string[];
  album?: string;
  year?: string | number;
  genre?: string[];
  picture?: Array<{
    format: string;
    data: Buffer;
  }>;
  duration?: number;
}

/**
 * Extract metadata from an audio file stream.
 * Supports MP3 (ID3), OGG (Vorbis), M4A/AAC, FLAC, and WAV formats.
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

  // For other formats, use musicmetadata
  return await loadWithMusicMetadata(stream);
}

async function loadWithMusicMetadata(
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

  // Create a Node-compatible stream from the buffer
  const nodeStream = createNodeReadableStream(data);

  // Parse metadata using musicmetadata
  const metadata = await new Promise<MusicMetadata>((resolve, reject) => {
    musicmetadata(
      nodeStream,
      { duration: true },
      (err: Error | null, meta: MusicMetadata) => {
        if (err != null) {
          reject(err);
        } else {
          resolve(meta);
        }
      },
    );
  });

  // Convert musicmetadata format to our ID3-compatible format
  return convertToId3Format(metadata, data);
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

function createNodeReadableStream(data: Uint8Array): any {
  let offset = 0;
  const chunkSize = 64 * 1024; // 64KB chunks

  const stream = {
    readable: true,
    on(event: string, handler: (...args: unknown[]) => void) {
      if (event === "data") {
        // Emit data in chunks
        while (offset < data.length) {
          const chunk = data.slice(
            offset,
            Math.min(offset + chunkSize, data.length),
          );
          offset += chunk.length;
          handler(Buffer.from(chunk));
        }
      }
      if (event === "end") {
        setImmediate(() => {
          handler();
        });
      }
      return stream;
    },
    removeListener() {
      return stream;
    },
    pause() {
      return stream;
    },
    resume() {
      return stream;
    },
    pipe(dest: any) {
      stream.on("data", (...args: unknown[]) => {
        dest.write(args[0]);
      });
      stream.on("end", () => {
        dest.end();
      });
      return dest;
    },
  };

  return stream;
}

function convertToId3Format(
  metadata: MusicMetadata,
  data: Uint8Array,
): AudioMetadata {
  // Create ID3-compatible frame structure
  const frames: ID3["frames"] = {};

  // Map common metadata fields to ID3 frame IDs
  if (typeof metadata.title === "string" && metadata.title.length > 0) {
    frames.TIT2 = {
      id: "TIT2",
      size: 0,
      flags: null,
      frameDataSize: null,
      description: "Title",
      data: metadata.title,
    };
  }

  if (Array.isArray(metadata.artist) && metadata.artist.length > 0) {
    frames.TOA = {
      id: "TOA",
      size: 0,
      flags: null,
      frameDataSize: null,
      description: "Artist",
      data: metadata.artist[0],
    };
  }

  if (typeof metadata.album === "string" && metadata.album.length > 0) {
    frames.TALB = {
      id: "TALB",
      size: 0,
      flags: null,
      frameDataSize: null,
      description: "Album",
      data: metadata.album,
    };
  }

  if (typeof metadata.year === "string" || typeof metadata.year === "number") {
    frames.TYER = {
      id: "TYER",
      size: 0,
      flags: null,
      frameDataSize: null,
      description: "Year",
      data: String(metadata.year),
    };
  }

  if (Array.isArray(metadata.genre) && metadata.genre.length > 0) {
    frames.TCON = {
      id: "TCON",
      size: 0,
      flags: null,
      frameDataSize: null,
      description: "Genre",
      data: metadata.genre[0],
    };
  }

  // Handle album art
  if (Array.isArray(metadata.picture) && metadata.picture.length > 0) {
    const picture = metadata.picture[0];
    frames.APIC = {
      id: "APIC",
      size: 0,
      flags: null,
      frameDataSize: null,
      description: "Picture",
      data: {
        mimetype:
          picture.format === "jpg" ? "image/jpeg" : `image/${picture.format}`,
        type: "Cover (front)",
        description: "",
        data: picture.data,
      },
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
