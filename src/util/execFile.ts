import { execFile as _execFile, type ExecFileOptionsWithStringEncoding } from 'child_process'

export async function execFile (executable: Parameters<typeof _execFile>[0], args: readonly string[] | undefined | null, opt?: Partial<ExecFileOptionsWithStringEncoding>) {
  return await new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
    _execFile(executable, args, { encoding: 'utf8', ...(opt ?? {}) }, (e, stdout, stderr) => {
      if (e != null) reject(Object.assign(e, { stdout, stderr }))
      else resolve({ stdout, stderr })
    })
  })
}
