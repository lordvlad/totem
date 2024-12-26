import { type PathLike } from 'fs'
import { stat } from 'fs/promises'

export async function isFile (path: PathLike) {
  try {
    return (await stat(path)).isFile()
  } catch (e) {
    if ((e as any).code === 'ENOENT') return false
    throw e
  }
}
