/* eslint-disable complexity -- really not sooo hard */
import { assert, is } from "tsafe/assert";
import type { ID3Art, Frame, FrameId, ID3 } from "./id3";

export class Track implements Pick<ID3, "fileName" | "frames"> {
  readonly fileName = "";
  readonly frames: ID3["frames"] = {};
  readonly size = 0;
  readonly data: Uint8Array | null = null;

  frame<T = unknown>(id: FrameId, data?: T) {
    // @ts-expect-error -- need this to support hydration 
    if (!this.frames) this.frames = {}
    const f1 = this.frames[id];
    const f2: Frame | undefined = Array.isArray(f1) ? f1[0] : f1;
    if (arguments.length === 2) {
      if (typeof f2 !== "undefined") {
        f2.data = data;
        return data;
      }
      // FIXME fix typing
      /* eslint-disable-next-line typescript-eslint/no-unsafe-type-assertion, typescript-eslint/consistent-type-assertions -- allow this for now, fix later */
      this.frames[id] = { data, id } as Frame;
      return data
    }
    if (f2 == null || typeof f2 === "undefined") return undefined;
    const d = f2.data;
    assert(is<T>(d));
    return d;
  }

  get title() {
    return this.frame<string>("TIT2");
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
