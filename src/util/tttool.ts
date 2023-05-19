import { chmod, mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join, sep } from "path";
import { download } from "./download";
import { execFile } from "./execFile";
import { isFile } from "./isFile";
import { unzip } from "./unzip";
import { spawn } from "child_process";

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
        await chmod(join(tttoolDir, `tttool-${version}`, 'linux', 'tttool'), 0o755)
    }
    console.log("Downloaded and unpacked tttool to", tttoolDir)
}

export async function tttool(...args: string[]) {
    await init()
    return await execFile(tttoolPath, args)
}

export async function play(path: string) {
    await init()

    const child = spawn(tttoolPath, ["play", path])
    child.stdin.setDefaultEncoding("utf-8")
    child.stdout.setEncoding("utf-8")
    child.stderr.setEncoding("utf-8")

    const out: string[] = []
    const err: string[] = []

    child.stdout.on("data", data => out.push(data))
    child.stderr.on("data", data => err.push(data))

    return {
        get err() { return err.join('') },
        get out() { return out.join('') },
        async exit() {
            return new Promise<void>((resolve, reject) => {

                child.once("exit", () => resolve())
                try {
                    child.stdin.write("\n")
                    child.stdin.cork()
                    child.stdin.write("\n")
                    child.stdin.uncork()
                    child.kill()
                } catch (e) {
                    reject(e)
                }
            })
        },
        touch(oid: number, sleepTime?: number) {
            out.splice(0, out.length)
            child.stdin.cork()
            child.stdin.write(`${oid}\n`)
            child.stdin.uncork()
        }
    }
}
