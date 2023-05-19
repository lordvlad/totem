// @vitest-environment jsdom


import { mkdtemp, rm, stat } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"

import { id } from "tsafe"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { Track } from "../../library/track"
import { hydrate } from "../../util/hydrate"
import { play, tttool } from "../../util/tttool"
import { createReadStream, createWriteStream } from "../../util/webStreams"
import { MediaTableItem, build, type GmeBuildConfig } from "../gme"


async function sleep(t: number) {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), t))
}

const fetch = async (v: MediaTableItem) => {
    return createReadStream(join(__dirname, v.track.fileName))
}

async function buildTo(cfg: Parameters<typeof build>[0], path: string) {
    await build(cfg, fetch).pipeTo(createWriteStream(path)).catch(e => {
        console.error(e)
        throw e
    })
}

async function getTestMedia() {
    return Promise.all(["back.ogg", "bing.ogg", "hello.ogg", "one.ogg", "three.ogg", "two.ogg"].map(async fileName => {
        const { size } = await stat(join(__dirname, fileName))
        return id<Track>(hydrate({
            title: fileName,
            artist: "Joachim Breitner",
            fileName,
            size
        }, Track))
    }))
}

describe("gme", async () => {
    let tmpDir: string

    const cfg: GmeBuildConfig = {
        productId: 1,
        language: "GERMAN",
        tracks: []
    }

    beforeAll(async () => {
        // initialize tttool with a large timeout so we can keep low timeouts for following calls
        await tttool("--help")
    }, 60 * 1000)

    beforeAll(async () => {
        // tmpDir = await mkdtemp(join("totem-vitest-"))
        tmpDir = await mkdtemp(join(tmpdir(), "totem-vitest-"))
        console.log(`Created tmp dir ${tmpDir}`)
    })

    afterAll(async () => {
        await rm(tmpDir, { recursive: true, force: true })
        console.log(`Cleaned tmp dir ${tmpDir}`)
    })

    it("should not fail", async () => {
        await buildTo(cfg, join(tmpDir, 'data1.gme'))
    })

    it("should produce a valid gme file", async () => {
        const gme = join(tmpDir, 'data2.gme')
        await buildTo({ ...cfg, tracks: await getTestMedia() }, gme)

        {
            const { stdout, stderr } = await tttool("info", gme)
            // console.log("stdout", stdout)
            // console.log("stderr", stderr)

            expect(stderr).toBeFalsy()
            expect(stdout).toContain(`Product ID: ${cfg.productId}`)
            expect(stdout).toContain(`Language: ${cfg.language.substring(0, 6)}`)
            expect(stdout).toContain(`Number of registers: 0`)
            expect(stdout).toContain(`Initial registers: []`)
            expect(stdout).toContain(`Initial sounds: []`)
            expect(stdout).toContain(`Audio table entries: 6`)
            expect(stdout).toContain(`Audio table copy: Absent`)
        }

        {
            const { stdout, stderr } = await tttool("lint", gme)
            expect(stderr).toBeFalsy()
            expect(stdout).toContain(`All lines do satisfy hypothesis "play indicies are correct"!`)
            expect(stdout).toContain(`All lines do satisfy hypothesis "media indicies are correct"!`)
        }

        {
            const { stdout, stderr } = await tttool("scripts", gme)
            expect(stderr).toBeFalsy()
            expect(stdout.split(/\r?\n/).join('\n')).toContain(`Script for OID 1401:
    0==0? P(0)
Script for OID 1402:
    0==0? P(1)
Script for OID 1403:
    0==0? P(2)
Script for OID 1404:
    0==0? P(3)
Script for OID 1405:
    0==0? P(4)
Script for OID 1406:
    0==0? P(5)`)

        }


        {
            const { stdout, stderr } = await tttool("media", "--dir", join(tmpDir, "media"), gme)
            expect(stderr).toBeFalsy()
            expect(stdout).toContain(`Audio Table entries: 6`)

            // TODO compare audio files byte-by-byte
        }

        {
            const game = await play(gme)
            await sleep(1000)
            expect(game.out).toContain('Initial')
            expect(game.err).toBeFalsy
            game.touch(1401)
            await sleep(3000)
            expect(game.out).toContain("Playing audio sample 0")

            await game.exit()
        }
    }, 10 * 1000)
})