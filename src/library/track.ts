import { type Frame, type FrameId, type ID3 } from "./id3";


export class Track implements Pick<ID3, "fileName" | "frames"> {
    readonly fileName = "";
    readonly frames = {} as ID3["frames"]
    readonly size = 0
    readonly data: Uint8Array | null = null

    frame<T = unknown>(id: FrameId, data?: T) {
        // @ts-ignore
        if (!this.frames) this.frames = {}
        const f1 = this.frames[id]
        let f2: Frame | undefined = Array.isArray(f1) ? f1[0] : f1
        if (arguments.length === 2) {
            if (typeof f2 !== "undefined") {
                f2.data = data
            } else {
                f2 = this.frames[id] = { data, id } as Frame
            }
        }
        return f2?.data as unknown as T
    }

    get title() { return this.frame<string>("TIT2") }
    set title(data: string) { this.frame("TIT2", data) }
    get artist() { return this.frame<string>("TOA") }
    set artist(data: string) { this.frame("TOA", data) }
    get album() { return this.frame<string>("TALB") }
    set album(data: string) { this.frame("TALB", data) }
}

