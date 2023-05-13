import { createWriteStream } from "node:fs";
import { get } from "node:https";

export function download(url: string, path: string) {
    return new Promise<void>((resolve, reject) => {
        function dl(url1: string, redirects: number) {
            get(url1, async (res) => {
                if (!res.statusCode) return reject(`No status code ${JSON.stringify(res)}`)
                if (res.statusCode < 200) return reject(`No idea what to do with status ${res.statusCode}`)
                if (res.statusCode < 300) {
                    const f = createWriteStream(path)
                    return res.pipe(f).on('finish', () => f.close(() => resolve())).on('error', reject);
                }
                if (res.statusCode < 400) {
                    const loc = res.headers['location']
                    if (!loc) return reject(`No idea what to do with status ${res.statusCode} if there is no Location header`)
                    if (redirects <= 0) return reject(`Too many redirects, stopping at ${loc}`)
                    return dl(loc, redirects - 1)
                }
                reject(`Failed with status code ${res.statusCode}`)
            }).on('error', reject);
        }

        dl(url, 10)
    });
}
