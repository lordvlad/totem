const textEncoder = new TextEncoder();

type FileLike = {
  directory: boolean;
  name: string;
  comment?: string;
  lastModified?: number | Date;
  stream: () => (ReadableStream<Uint8Array> | Promise<ReadableStream<Uint8Array>>);
}

type ZippedFile = {
  directory: boolean;
  nameBuf: Uint8Array;
  offset: bigint;
  comment: Uint8Array;
  compressedLength: bigint;
  uncompressedLength: bigint;
  header: Uint8Array;
  crc: number;
}

const crc32 = (() => {
  const table = ((ta: number[], i, j, t) => {
    for (i = 0; i < 256; i++) {
      t = i;
      for (j = 0; j < 8; j++) {
        t = t & 1 ? (t >>> 1) ^ 0xedb88320 : t >>> 1;
      }
      ta[i] = t;
    }
    return ta;
  })([], 0, 0, 0)

  return function () {
    let crc = -1;
    return {
      append(data: Uint8Array) {
        let c = crc | 0;
        for (let offset = 0, len = data.length | 0; offset < len; offset++) {
          c = (c >>> 8) ^ table[(c ^ data[offset]) & 0xff];
        }
        crc = c;
      },
      get() { return (crc ^ -1) >>> 0; }
    }
  }

})();


class ZipTransformer implements Transformer<FileLike, Uint8Array> {
  offset: bigint;
  files: Record<string, ZippedFile>;
  constructor() {
    this.files = Object.create(null);
    this.offset = BigInt(0);
  }
  async transform(entry: FileLike, ctrl: TransformStreamDefaultController) {
    const name = entry.directory && !entry.name.trim().endsWith('/')
      ? `${entry.name.trim()}/`
      : entry.name.trim();

    if (this.files[name]) ctrl.error(new Error('File already exists.'));

    const nameBuf = textEncoder.encode(name);

    const zippedFile = this.files[name] = {
      directory: !!entry.directory,
      nameBuf,
      offset: this.offset,
      comment: textEncoder.encode(entry.comment || ''),
      compressedLength: BigInt(0),
      uncompressedLength: BigInt(0),
      header: new Uint8Array(26),
      crc: 0,
    } as ZippedFile;

    this.enqueueHead(ctrl, entry, zippedFile);
    await this.enqueueBody(ctrl, entry, zippedFile);
    this.enqueueFoot(ctrl, zippedFile);
  }

  private async enqueueBody(ctrl: TransformStreamDefaultController, entry: FileLike, zippedFile: ZippedFile) {
    const { append, get } = crc32();
    const reader = (await entry.stream()).getReader();
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      append(chunk);
      // PSYCH! We're not actually compressing anything.
      zippedFile.uncompressedLength += BigInt(chunk.length);
      zippedFile.compressedLength += BigInt(chunk.length);
      ctrl.enqueue(chunk);
    }
    const hdv = new DataView(zippedFile.header.buffer);
    hdv.setUint32(10, zippedFile.crc = get(), true);
    hdv.setUint32(14, Number(zippedFile.compressedLength), true);
    hdv.setUint32(18, Number(zippedFile.uncompressedLength), true);
  }

  private enqueueFoot(ctrl: TransformStreamDefaultController, { header, compressedLength }: ZippedFile) {
    const footer = new Uint8Array(16);
    footer.set([80, 75, 7, 8]);
    footer.set(header.subarray(10, 22), 4);
    this.offset += compressedLength + BigInt(16);
    ctrl.enqueue(footer);
  }

  private enqueueHead(ctrl: TransformStreamDefaultController, entry: FileLike, { header, nameBuf }: ZippedFile) {
    const date = new Date(
      typeof entry.lastModified === 'undefined'
        ? Date.now()
        : entry.lastModified
    );
    const hdv = new DataView(header.buffer);
    hdv.setUint32(0, 0x14000808);
    hdv.setUint16(6,
      (((date.getHours() << 6) | date.getMinutes()) << 5) | (date.getSeconds() / 2),
      true);
    hdv.setUint16(8,
      ((((date.getFullYear() - 1980) << 4) | (date.getMonth() + 1)) << 5) | date.getDate(),
      true);

    hdv.setUint16(22, nameBuf.length, true);

    const data = new Uint8Array(30 + nameBuf.length);
    data.set([80, 75, 3, 4]);
    data.set(header, 4);
    data.set(nameBuf, 30);

    this.offset = this.offset + BigInt(data.length);
    ctrl.enqueue(data);
  }

  flush(ctrl: TransformStreamDefaultController) {
    let length = 0;
    let index = 0;

    Object.keys(this.files).forEach((fileName) => {
      const file = this.files[fileName];
      length += 46 + file.nameBuf.length + file.comment.length;
    });

    const data = new Uint8Array(length + 22);
    const dv = new DataView(data.buffer);

    Object.keys(this.files).forEach((fileName) => {
      const file = this.files[fileName];
      dv.setUint32(index, 0x504b0102);
      dv.setUint16(index + 4, 0x1400);
      dv.setUint16(index + 32, file.comment.length, true);
      dv.setUint8(index + 38, file.directory ? 16 : 0);
      dv.setUint32(index + 42, Number(file.offset), true);
      data.set(file.header, index + 6);
      data.set(file.nameBuf, index + 46);
      data.set(file.comment, index + 46 + file.nameBuf.length);
      index += 46 + file.nameBuf.length + file.comment.length;
    });

    dv.setUint32(index, 0x504b0506); // EOCD signature
    dv.setUint16(index + 4, 0, true); // Number of this disk
    dv.setUint16(index + 6, 0, true); // Number of the disk with the start of the central directory
    dv.setUint16(index + 8, Object.keys(this.files).length, true); // Total number of entries in the central directory on this disk
    dv.setUint16(index + 10, Object.keys(this.files).length, true); // Total number of entries in the central directory
    dv.setUint32(index + 12, length, true); // Size of the central directory
    dv.setUint32(index + 16, Number(this.offset), true); // Offset of the start of the central directory
    dv.setUint16(index + 20, 0, true); // Comment length
    ctrl.enqueue(data);

    this.files = Object.create(null);
    this.offset = BigInt(0);
  }
}

export class ZipTransformStream extends TransformStream<FileLike, Uint8Array> {
  constructor() {
    super(new ZipTransformer());
  }
}
