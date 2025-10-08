import { describe, it, expect } from "bun:test";
import {
  createLayout,
  BufWriter,
  writeLayout,
  GmeBuildConfig,
  build,
  write,
  MediaTableItem,
} from "../gme";
import { readFile } from "fs/promises";
import { join } from "path";
import { Track } from "../../mp3/track";

// Helper to create a simple test configuration
async function createTestConfig(): Promise<GmeBuildConfig> {
  const audioFiles = [
    "hello.ogg",
    "one.ogg",
    "two.ogg",
    "three.ogg",
    "back.ogg",
    "bing.ogg",
  ];

  const tracks: Track[] = await Promise.all(
    audioFiles.map(async (file) => {
      const path = join(__dirname, file);
      const data = await readFile(path);
      return {
        fileName: file,
        size: data.byteLength,
        data: new Uint8Array(data),
      } as Track;
    }),
  );

  return {
    productId: 1,
    tracks,
    language: "GERMAN",
    comment: "CHOMPTECH DATA FORMAT CopyRight 2009 Ver2.1.2222",
  };
}

// Helper to get media function
async function getMediaFn(item: MediaTableItem) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      if (item.track.data) {
        controller.enqueue(item.track.data);
      }
      controller.close();
    },
  });
}

// Helper to read all data from a stream
async function readStream(
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

describe("writeLayout", () => {
  it("should produce comparable results to createLayout", async () => {
    const config = await createTestConfig();

    // Use createLayout (old approach)
    const oldLayout = createLayout(config);
    const oldBuf = new ArrayBuffer(oldLayout.size);
    const oldView = new DataView(oldBuf);
    const oldUint8 = new Uint8Array(oldBuf);
    oldLayout.write({ buf: oldBuf, view: oldView, uint8: oldUint8 });

    // Use writeLayout (new approach)
    // We need to estimate the buffer size - let's use the old size as a starting point
    const newWriter = new BufWriter(oldLayout.size);
    writeLayout(newWriter, config);
    const newSize = newWriter.getWriteIndex();
    const newUint8 = new Uint8Array(newWriter.buf, 0, newSize);
    const newView = newWriter.view;

    console.log("Old layout size:", oldLayout.size);
    console.log("New layout size:", newSize);

    // Check all header offset fields
    const offsets = [
      { name: "Script table", addr: 0x0000 },
      { name: "Media table", addr: 0x0004 },
      { name: "Magic number", addr: 0x0008 },
      { name: "Additional script table", addr: 0x000c },
      { name: "Game table", addr: 0x0010 },
      { name: "Product ID", addr: 0x0014 },
      { name: "Initial register values", addr: 0x0018 },
      { name: "Power-on sound", addr: 0x0071 },
      { name: "Special codes", addr: 0x0094 },
    ];

    console.log("\nOffset Comparisons:");
    console.log("===================");
    let hasOffsetDifferences = false;
    for (const { name, addr } of offsets) {
      const oldVal = oldView.getUint32(addr, true);
      const newVal = newView.getUint32(addr, true);
      const diff = newVal - oldVal;
      const match = oldVal === newVal ? "✓" : "✗";
      console.log(
        `${match} ${name.padEnd(30)} @ 0x${addr.toString(16).padStart(4, "0")}: old=${oldVal.toString().padStart(5)} new=${newVal.toString().padStart(5)} diff=${diff >= 0 ? "+" : ""}${diff}`,
      );
      if (oldVal !== newVal) {
        hasOffsetDifferences = true;
      }
    }

    if (hasOffsetDifferences) {
      console.log("\n⚠️  Offset differences detected!");
    }

    // Special codes offset for byte-by-byte comparison
    const oldSpecialCodesOffset = oldView.getUint32(0x0094, true);
    const newSpecialCodesOffset = newView.getUint32(0x0094, true);

    // Byte-by-byte comparison of special codes table (40 bytes)
    const specialCodesSize = 40;
    let specialCodesMatch = true;
    const specialCodesDiffs: string[] = [];

    for (let i = 0; i < specialCodesSize; i++) {
      const oldByte = oldUint8[oldSpecialCodesOffset + i];
      const newByte = newUint8[newSpecialCodesOffset + i];
      if (oldByte !== newByte) {
        specialCodesMatch = false;
        specialCodesDiffs.push(
          `Byte ${i}: old=0x${oldByte?.toString(16).padStart(2, "0") ?? "??"}, new=0x${newByte?.toString(16).padStart(2, "0") ?? "??"}`,
        );
      }
    }

    console.log("Special codes table match:", specialCodesMatch ? "YES" : "NO");
    if (!specialCodesMatch) {
      console.log("Special codes table differences:");
      for (const diff of specialCodesDiffs) {
        console.log("  " + diff);
      }
    }

    // Verify special codes table matches byte-by-byte
    expect(specialCodesMatch).toBe(true);

    console.log("Header comparison completed");
  });

  it("should produce comparable results with build vs write", async () => {
    const config = await createTestConfig();

    // Use build (old approach)
    const oldStream = build(config, getMediaFn);
    const oldData = await readStream(oldStream);

    // Use write (new approach)
    const newStream = write(config, getMediaFn);
    const newData = await readStream(newStream);

    console.log("Old build output size:", oldData.length);
    console.log("New write output size:", newData.length);

    // The last 4 bytes are the checksum - they should match if everything is correct
    const oldChecksum = new DataView(
      oldData.buffer,
      oldData.byteOffset + oldData.length - 4,
      4,
    ).getUint32(0, true);
    const newChecksum = new DataView(
      newData.buffer,
      newData.byteOffset + newData.length - 4,
      4,
    ).getUint32(0, true);

    console.log("Old checksum:", oldChecksum.toString(16).padStart(8, "0"));
    console.log("New checksum:", newChecksum.toString(16).padStart(8, "0"));

    // Check header fields from the output
    const oldView = new DataView(oldData.buffer, oldData.byteOffset);
    const newView = new DataView(newData.buffer, newData.byteOffset);

    // Script table offset at 0x0000
    expect(newView.getUint32(0x0000, true)).toBe(
      oldView.getUint32(0x0000, true),
    );
    // Magic number at 0x0008
    expect(newView.getUint32(0x0008, true)).toBe(
      oldView.getUint32(0x0008, true),
    );
    // Product ID at 0x0014
    expect(newView.getUint32(0x0014, true)).toBe(
      oldView.getUint32(0x0014, true),
    );

    console.log("Build vs Write comparison completed");
  });
});
