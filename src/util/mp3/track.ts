/* eslint-disable complexity -- really not sooo hard */
import { assert, is } from "tsafe/assert";
import type { ID3Art, Frame, FrameId, ID3 } from "./id3";
import { FRAMES } from "./frames";

export class Track implements Pick<ID3, "fileName" | "frames"> {
  readonly uuid = "";
  readonly fileName = "";
  readonly frames: ID3["frames"] = {};
  readonly size = 0;
  readonly data: Uint8Array | null = null;

  frame<T = unknown>(id: FrameId, data?: T) {
    // @ts-expect-error -- need this to support hydration
    this.frames ||= {};
    const f1 = this.frames[id];
    const f2: Frame | undefined = Array.isArray(f1) ? f1[0] : f1;
    if (arguments.length === 2) {
      if (typeof f2 !== "undefined") {
        f2.data = data;
        return data;
      }
      this.frames[id] = {
        data,
        id,
        size: 0,
        flags: null,
        frameDataSize: null,
        description: FRAMES[id],
      };
      return data;
    }
    if (f2 == null || typeof f2 === "undefined") return undefined;
    const d = f2.data;
    assert(is<T>(d));
    return d;
  }

  get title() {
    const titleFromMetadata = this.frame<string>("TIT2");
    if (titleFromMetadata !== undefined && titleFromMetadata !== "") {
      return titleFromMetadata;
    }
    // Fallback to filename without extension
    if (typeof this.fileName === "string" && this.fileName.length > 0) {
      const lastDotIndex = this.fileName.lastIndexOf(".");
      if (lastDotIndex > 0) {
        return this.fileName.substring(0, lastDotIndex);
      }
      return this.fileName;
    }
    return undefined;
  }
  set title(data: string | undefined) {
    this.frame("TIT2", data);
  }
  get artist() {
    return this.frame<string>("TOA");
  }
  set artist(data: string | undefined) {
    this.frame("TOA", data);
  }
  get album() {
    return this.frame<string>("TALB");
  }
  set album(data: string | undefined) {
    this.frame("TALB", data);
  }
  get art() {
    return this.frame<ID3Art>("APIC");
  }
  set art(data: ID3Art | undefined) {
    this.frame("APIC", data);
  }
}
