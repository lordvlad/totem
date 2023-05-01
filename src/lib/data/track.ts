import { type Frame, type FrameId, type ID3 } from "./id3";


export class Track implements Pick<ID3, 'fileName' | 'frames'> {
    readonly fileName = "";
    readonly frames = {} as ID3["frames"]
    readonly data: Uint8Array | null = null

    frame<T = unknown>(id: FrameId) {
        const f = this.frames[id]
        const frame: Frame | undefined = Array.isArray(f) ? f[0] : f
        return frame?.data as unknown as T
    }

    get title() { return this.frame<string>('TIT2') }
    get artist() { return this.frame<string>('TOA') }
    get album() { return this.frame<string>('TALB') }
}

