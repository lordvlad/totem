import { mkdir as fsMkdir } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { it } from 'vitest';
import { ZipTransformStream } from './ZipTransformStream';
import { createWriteStream } from './webStreams';

const mkdir = promisify(fsMkdir);
const textEncoder = new TextEncoder();

it('should correctly process the file stream', async () => {
  const mockFileLike = {
    directory: false,
    name: 'test.txt',
    stream: () => new ReadableStream({
      start(controller) {
        controller.enqueue(textEncoder.encode('Hello, '));
        controller.enqueue(textEncoder.encode('World'));
        controller.close();
      }
    })
  };

  const zipFileWriter = new ZipTransformStream();

  const outputDir = join(__dirname, 'test_results');
  await mkdir(outputDir, { recursive: true });

  zipFileWriter.readable.pipeTo(createWriteStream(join(outputDir, 'test.zip')));
  const w = zipFileWriter.writable.getWriter()
  await w.write(mockFileLike);
  await w.close()
});
