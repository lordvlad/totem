import { execFile as _execFile } from "child_process";

export function execFile(executable: Parameters<typeof _execFile>[0], args: Parameters<typeof _execFile>[1]) {
    return new Promise<{ stdout: string; stderr: string; }>((resolve, reject) => {
        _execFile(executable, args, (e, stdout, stderr) => {
            if (e) reject(Object.assign(e, { stdout, stderr }))
            else resolve({ stdout, stderr })
        })
    })
}
