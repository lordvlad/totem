import type { PathLike } from "fs";
import { stat } from "fs/promises";

export async function exists(path: PathLike) {
  try {
    await stat(path);
    return true;
  } catch (e) {
    if (!(e instanceof Error)) throw new Error(String(e));
    if ("code" in e && e.code === "ENOENT") return false;
    throw e;
  }
}
