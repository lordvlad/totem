import { chmod, mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join, sep } from "path";
import { download } from "./download";
import { execFile } from "./execFile";
import { isFile } from "./isFile";
import { unzip } from "./unzip";
import { spawn } from "child_process";
import { Deferred, deferred } from "./deferred";

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

const stdoutIdleTime = 200

export async function play(path: string) {
    await init()

    const child = spawn(tttoolPath, ["play", path])
    child.stdin.setDefaultEncoding("utf-8")
    child.stdout.setEncoding("utf-8")
    child.stderr.setEncoding("utf-8")

    const out: string[] = []
    const err: string[] = []

    const outDeferredRef = { val: deferred<string>() };
    const errDeferredRef = { val: deferred<string>() };

    let resolveTimer: number | null = null

    let armResolve = () => {
        if (resolveTimer !== null) clearTimeout(resolveTimer)
        resolveTimer = setTimeout(() => {
            outDeferredRef.val.resolve(out.join(''));
            errDeferredRef.val.resolve(err.join(''));
            resolveTimer = null
        }, stdoutIdleTime) as unknown as number
    }

    child.stdout.on("data", data => { out.push(data); armResolve() })
    child.stderr.on("data", data => { err.push(data); armResolve() })

    return {
        get out() { return outDeferredRef.val.promise },
        get err() { return errDeferredRef.val.promise },
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
        touch(oid: number) {
            out.splice(0, out.length)
            outDeferredRef.val = deferred<string>();
            errDeferredRef.val = deferred<string>();
            child.stdin.cork()
            child.stdin.write(`${oid}\n`)
            child.stdin.uncork()
        }
    }
}
