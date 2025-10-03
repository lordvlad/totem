import { chmod, mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join, sep } from "path";
import { download } from "./download";
import { execFile } from "./execFile";
import { isFile } from "./isFile";
import { unzip } from "./unzip";
import { type ExecOptionsWithStringEncoding, spawn } from "child_process";

const version = "1.11";
const tttoolDir = join(tmpdir(), "totem-tttool");
const tttoolPath = join(
  tttoolDir,
  `tttool-${version}`,
  sep === "/" ? "tttool" : "tttool.exe",
);
const url = `https://github.com/entropia/tip-toi-reveng/releases/download/${version}/tttool-${version}.zip`;

async function init() {
  if (await isFile(tttoolPath)) return;
  await mkdir(tttoolDir, { recursive: true });
  await download(url, join(tttoolDir, "tttool.zip"));
  await unzip(join(tttoolDir, "tttool.zip"), tttoolDir);
  if (sep === "/") {
    await chmod(tttoolPath, 0o755);
    await chmod(join(tttoolDir, `tttool-${version}`, "linux", "tttool"), 0o755);
  }
  console.log("Downloaded and unpacked tttool to", tttoolDir);
}

export async function tttool(
  ...args: string[]
): Promise<{ stdout: string; stderr: string }>;
export async function tttool(
  opt: Partial<ExecOptionsWithStringEncoding>,
  ...args: string[]
): Promise<{ stdout: string; stderr: string }>;
export async function tttool(
  a: string | Partial<ExecOptionsWithStringEncoding>,
  ...b: string[]
) {
  await init();
  return await execFile(
    tttoolPath,
    typeof a === "object" ? [...b] : [a, ...b],
    typeof a === "object" ? a : {},
  );
}

const stdoutIdleTime = 200;

export async function play(path: string) {
  await init();

  const child = spawn(tttoolPath, ["play", path]);
  child.stdin.setDefaultEncoding("utf-8");
  child.stdout.setEncoding("utf-8");
  child.stderr.setEncoding("utf-8");

  const out: string[] = [];
  const err: string[] = [];

  const outDeferredRef = { val: Promise.withResolvers<string>() };
  const errDeferredRef = { val: Promise.withResolvers<string>() };

  let resolveTimer: NodeJS.Timeout | null = null;

  const armResolve = () => {
    if (resolveTimer !== null) clearTimeout(resolveTimer);
    resolveTimer = setTimeout(() => {
      outDeferredRef.val.resolve(out.join(""));
      errDeferredRef.val.resolve(err.join(""));
      resolveTimer = null;
    }, stdoutIdleTime);
  };

  child.stdout.on("data", (data) => {
    out.push(String(data));
    armResolve();
  });
  child.stderr.on("data", (data) => {
    err.push(String(data));
    armResolve();
  });

  return {
    get out() {
      return outDeferredRef.val.promise;
    },
    get err() {
      return errDeferredRef.val.promise;
    },
    async exit() {
      return await new Promise<void>((resolve, reject) => {
        child.once("exit", () => resolve());
        try {
          child.stdin.write("\n");
          child.stdin.cork();
          child.stdin.write("\n");
          child.stdin.uncork();
          child.kill();
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      });
    },
    touch(oid: number) {
      out.splice(0, out.length);
      outDeferredRef.val = Promise.withResolvers<string>();
      errDeferredRef.val = Promise.withResolvers<string>();
      child.stdin.cork();
      child.stdin.write(`${oid}\n`);
      child.stdin.uncork();
    },
  };
}
