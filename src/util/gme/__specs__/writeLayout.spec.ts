import { describe, it, expect } from "vitest";
import { createLayout, BufWriter, writeLayout, GmeBuildConfig } from "../gme";
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

    // Check specific header fields
    // Script table offset at 0x0000
    const oldScriptTableOffset = oldView.getUint32(0x0000, true);
    const newScriptTableOffset = newView.getUint32(0x0000, true);
    console.log(
      "Script table offset - old:",
      oldScriptTableOffset,
      "new:",
      newScriptTableOffset,
    );
    expect(newScriptTableOffset).toBe(oldScriptTableOffset);

    // Media table offset at 0x0004
    const oldMediaTableOffset = oldView.getUint32(0x0004, true);
    const newMediaTableOffset = newView.getUint32(0x0004, true);
    console.log(
      "Media table offset - old:",
      oldMediaTableOffset,
      "new:",
      newMediaTableOffset,
    );

    // Magic number at 0x0008
    const oldMagicNumber = oldView.getUint32(0x0008, true);
    const newMagicNumber = newView.getUint32(0x0008, true);
    console.log(
      "Magic number - old:",
      oldMagicNumber.toString(16),
      "new:",
      newMagicNumber.toString(16),
    );
    expect(newMagicNumber).toBe(oldMagicNumber);

    // Product ID at 0x0014
    const oldProductId = oldView.getUint32(0x0014, true);
    const newProductId = newView.getUint32(0x0014, true);
    console.log("Product ID - old:", oldProductId, "new:", newProductId);
    expect(newProductId).toBe(oldProductId);

    console.log("Header comparison completed");
  });
});
