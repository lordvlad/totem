
export function concatBuffers(...chunks: Uint8Array[]) {
    const length = chunks.reduce((l, chunk) => l + chunk.length, 0);
    return chunks.reduce(([offset, concatd], chunk) => {
        concatd.set(chunk, offset);
        return [offset + chunk.length, concatd] as [number, Uint8Array];
    }, [0, new Uint8Array(length)] as [number, Uint8Array])[1];
}
