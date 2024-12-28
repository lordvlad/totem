export function singleChunkStream<R>(chunk: R): ReadableStream<R> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(chunk);
      controller.close();
    },
  });
}
