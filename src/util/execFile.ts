import {
  execFile as _execFile,
  type ExecFileOptionsWithStringEncoding,
} from "child_process";

export async function execFile(
  executable: Parameters<typeof _execFile>[0],
  args: readonly string[] | undefined | null,
  opt?: Partial<ExecFileOptionsWithStringEncoding>,
) {
  return await new Promise<{ stdout: string; stderr: string }>(
    (resolve, reject) => {
      _execFile(
        executable,
        args,
        { encoding: "utf8", ...(opt ?? {}) },
        (e, stdout, stderr) => {
          if (e != null) {
            Object.assign(e, { stdout, stderr });
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- e IS an error
            reject(e);
          } else {
            resolve({ stdout, stderr });
          }
        },
      );
    },
  );
}
