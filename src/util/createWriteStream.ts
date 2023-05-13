import { WriteStream, createWriteStream as _createWriteStream, type PathLike } from "node:fs"

export function createWriteStream(path: PathLike, options?: Parameters<typeof _createWriteStream>[1]) {
    return WriteStream.toWeb(_createWriteStream(path, options))
}