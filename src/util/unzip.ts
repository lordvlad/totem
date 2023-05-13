import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Entry, open } from "yauzl";

export function unzip(src: string, target: string) {
    return new Promise<void>((resolve, reject) => {
        open(src, { lazyEntries: true }, (err, zipfile) => {
            if (err) return reject(err);
            zipfile.on("end", () => resolve());
            zipfile.on("entry", async (entry: Entry) => {
                if (entry.fileName.endsWith('/')) {
                    await mkdir(join(target, entry.fileName), { recursive: true });
                    zipfile.readEntry();
                } else {
                    zipfile.openReadStream(entry, (err, readStream) => {
                        if (err) return reject(err);
                        const f = createWriteStream(join(target, entry.fileName))
                        readStream.pipe(f).on("finish", () => f.close(() => zipfile.readEntry()));
                    });
                }
            });
            zipfile.readEntry();
        });
    });
}
