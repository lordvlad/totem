export function concatStreams<R>(
  streams: Iterable<ReadableStream<R>> | AsyncIterable<ReadableStream<R>>,
): ReadableStream<R> {
  const { readable, writable } = new TransformStream<R, R>();

  // start the async pump
  (async () => {
    for await (const stream of streams) {
      await stream.pipeTo(writable, { preventClose: true });
    }
    await writable.close();
  })().catch(async (e: unknown) => await writable.abort(e));

  return readable;
}
