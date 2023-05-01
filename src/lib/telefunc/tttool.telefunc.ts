import { mkdtemp, rm, writeFile } from "fs/promises";
import { join } from "path"

import { type Options } from "../data/options";
import { type ID3 } from "../data/id3";
import trimIndent from "../util/trimIndent";


async function sleep(t: number) {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), t))
}



async function tttool({ options, tracks }: { options: Options, tracks: ID3[] }) {
    let dir: string | undefined
    try {
        dir = await mkdtemp('totem-')

        // FIXME
        const oid = 1000

        console.log("Created tmp dir", dir)

        const ymlPath = join(dir, "totem.yaml")

        const welcome = ""

        const prev = [""]
        const play = [""]
        const next = [""]
        const trackScripts = [""]

        await writeFile(ymlPath, trimIndent`
          # this file has been automatically created by totem
          product-id: ${oid}
          comment: "CHOMPTECH DATA FORMAT CopyRight 2019 Ver0.00.0001
          gme-lang: ${options.penLanguage}
          media-path: audio/track_%s
          init: $current:=0
          ${welcome}
          scripts:
            prev: ${prev.join('\n  -')}
            play: ${play.join('\n  -')}
            next: ${next.join('\n  -')}
            stop:
            - C C
            ${trackScripts.map((ts, i) =>
            trimIndent`t${i}:
                - ${ts}`)}
          `, "utf-8")


        return { message: "Hello Dieter" }
    } finally {
        if (dir) {
            await rm(dir, { force: true, recursive: true })
            console.log("Cleaned up tmp dir", dir)
        }

    }
}

export { tttool }