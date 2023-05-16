import { chmod, mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join, sep } from "path";
import { download } from "./download";
import { execFile } from "./execFile";
import { isFile } from "./isFile";
import { unzip } from "./unzip";

const version = "1.11"
const tttoolDir = join(tmpdir(), "totem-tttool")
const tttoolPath = join(tttoolDir, `tttool-${version}`, sep === '/' ? 'tttool' : 'tttool.exe')
const url = `https://github.com/entropia/tip-toi-reveng/releases/download/${version}/tttool-${version}.zip`

async function init() {
    if (await isFile(tttoolPath)) return
    await mkdir(tttoolDir, { recursive: true })
    await download(url, join(tttoolDir, "tttool.zip"))
    await unzip(join(tttoolDir, "tttool.zip"), tttoolDir)
    if (sep === '/') {
        await chmod(tttoolPath, 0o755)
        await chmod(join(tttoolDir, `tttool-${version}`, 'linux', 'ttool'), 0o755)
    }
    console.log("Downloaded and unpacked tttool to", tttoolDir)
}

export async function tttool(...args: string[]) {
    await init()
    return await execFile(tttoolPath, args)
}
