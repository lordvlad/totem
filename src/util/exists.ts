import { type PathLike } from "node:fs";
import { stat } from "node:fs/promises";


export async function exists(path: PathLike) {
    try {
        await stat(path);
        return true;
    } catch (e) {
        if ((e as any).code === 'ENOENT') return false;
        throw e;
    }
}
