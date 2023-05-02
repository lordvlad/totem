import { type Frame, type FrameId, type ID3 } from "./id3";


export class Track implements Pick<ID3, "fileName" | "frames"> {
    readonly fileName = "";
    readonly frames = {} as ID3["frames"]
    readonly data: Uint8Array | null = null

    frame<T = unknown>(id: FrameId) {
        const f = this.frames[id]
        const frame: Frame | undefined = Array.isArray(f) ? f[0] : f
        return frame?.data as unknown as T
    }

    get title() { return this.frame<string>("TIT2") }
    set title(data: string) { this.frames["TIT2"] = { data, id: "TIT2" } as Frame }
    get artist() { return this.frame<string>("TOA") }
    set artist(data: string) { this.frames["TOA"] = { data, id: "TOA" } as Frame }
    get album() { return this.frame<string>("TALB") }
    set album(data: string) { this.frames["TALB"] = { data, id: "TALB" } as Frame }
}

