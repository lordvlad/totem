import { createWriteStream } from 'fs'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { Entry, open } from 'yauzl'

export async function unzip (src: string, target: string) {
  return await new Promise<void>((resolve, reject) => {
    open(src, { lazyEntries: true }, (err, zipfile) => {
      if (err != null) return reject(err)
      zipfile.on('end', () => resolve())
      zipfile.on('entry', async (entry: Entry) => {
        if (entry.fileName.endsWith('/')) {
          await mkdir(join(target, entry.fileName), { recursive: true })
          zipfile.readEntry()
        } else {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err != null) return reject(err)
            const f = createWriteStream(join(target, entry.fileName))
            readStream.pipe(f).on('finish', () => f.close(() => zipfile.readEntry()))
          })
        }
      })
      zipfile.readEntry()
    })
  })
}
