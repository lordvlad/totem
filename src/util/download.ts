import { createWriteStream } from "fs";
import { get } from "https";

export async function download(url: string, path: string) {
  return await new Promise<void>((resolve, reject) => {
    function dl(url1: string, redirects: number) {
      // eslint-disable-next-line complexity -- its not soooo hard
      get(url1, (res) => {
        if (res.statusCode == null) {
          return reject(new Error(`No status code ${JSON.stringify(res)}`));
        }
        if (res.statusCode < 200) {
          return reject(
            new Error(`No idea what to do with status ${res.statusCode}`),
          );
        }
        if (res.statusCode < 300) {
          const f = createWriteStream(path);
          return res
            .pipe(f)
            .on("finish", () => f.close(() => resolve()))
            .on("error", reject);
        }
        if (res.statusCode < 400) {
          const loc = res.headers.location;
          if (loc == null) {
            return reject(
              new Error(
                `No idea what to do with status ${res.statusCode} if there is no Location header`,
              ),
            );
          }
          if (redirects <= 0) {
            return reject(new Error(`Too many redirects, stopping at ${loc}`));
          }
          return dl(loc, redirects - 1);
        }
        reject(new Error(`Failed with status code ${res.statusCode}`));
      }).on("error", reject);
    }

    dl(url, 10);
  });
}
