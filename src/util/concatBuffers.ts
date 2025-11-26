export function concatBuffers(...chunks: Uint8Array[]) {
  const length = chunks.reduce((l, chunk) => l + chunk.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
