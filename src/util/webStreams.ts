import {
  ReadStream,
  WriteStream,
  createReadStream as _createReadStream,
  createWriteStream as _createWriteStream,
  type PathLike,
} from "fs";

export function createWriteStream(
  path: PathLike,
  options?: Parameters<typeof _createWriteStream>[1],
) {
  return WriteStream.toWeb(_createWriteStream(path, options));
}

export function createReadStream(
  path: PathLike,
  options?: Parameters<typeof _createReadStream>[1],
) {
  return ReadStream.toWeb(_createReadStream(path, options));
}
