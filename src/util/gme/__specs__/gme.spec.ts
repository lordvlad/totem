/* eslint-disable @typescript-eslint/require-await -- this is only a test file */
/* eslint-disable @typescript-eslint/init-declarations -- this is only a test file */
/* eslint-disable @typescript-eslint/no-unsafe-call -- expect is typed as error in bun:test */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- expect is typed as error in bun:test */

import { mkdtemp, rm, stat } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { id } from "tsafe";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";

import { hydrate } from "../../hydrate";
import { Track } from "../../mp3/track";
import { play, tttool } from "../../tttool";
import { createReadStream, createWriteStream } from "../../webStreams";
import { type MediaTableItem, build, type GmeBuildConfig } from "../gme";

const fetch = async (v: MediaTableItem): Promise<ReadableStream<Uint8Array>> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- we know what we're doing
  createReadStream(
    join(__dirname, v.track.fileName),
  ) as ReadableStream<Uint8Array>;

async function buildTo(cfg: Parameters<typeof build>[0], path: string) {
  await build(cfg, fetch)
    .pipeTo(createWriteStream(path))
    .catch((e: unknown) => {
      console.error(e);
      throw e instanceof Error ? e : new Error(String(e));
    });
}

async function getTestMedia() {
  return await Promise.all(
    [
      "back.ogg",
      "bing.ogg",
      "hello.ogg",
      "one.ogg",
      "three.ogg",
      "two.ogg",
    ].map(async (fileName) => {
      const { size } = await stat(join(__dirname, fileName));
      return id<Track>(
        hydrate(
          {
            title: fileName,
            artist: "Joachim Breitner",
            fileName,
            uuid: crypto.randomUUID(),
            size,
          },
          Track,
        ),
      );
    }),
  );
}

describe("gme", async () => {
  let tmpDir: string;

  const cfg: GmeBuildConfig = {
    productId: 1,
    language: "GERMAN",
    tracks: [],
    stopOid: 7778,
    replayOid: 7779,
  };

  beforeAll(async () => {
    // initialize tttool with a large timeout so we can keep low timeouts for following calls
    await tttool("--help");
  });

  beforeAll(async () => {
    // tmpDir = await mkdtemp(join("totem-vitest-"))
    tmpDir = await mkdtemp(join(tmpdir(), "totem-vitest-"));
    console.log(`Created tmp dir ${tmpDir}`);
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
    console.log(`Cleaned tmp dir ${tmpDir}`);
  });

  it("should not fail", async () => {
    await buildTo(cfg, join(tmpDir, "data1.gme"));
  });

  it("should produce a valid gme file", async () => {
    const gme = join(tmpDir, "data2.gme");
    await buildTo({ ...cfg, tracks: await getTestMedia() }, gme);

    {
      const { stdout, stderr } = await tttool("info", gme);
      console.log("stdout", stdout);
      console.log("stderr", stderr);

      expect(stderr).toBeFalsy();
      expect(stdout).toContain(`Product ID: ${cfg.productId}`);
      expect(stdout).toContain(`Language: ${cfg.language.substring(0, 6)}`);
      expect(stdout).toContain("Number of registers: 0");
      expect(stdout).toContain("Initial registers: []");
      expect(stdout).toContain("Initial sounds: []");
      expect(stdout).toContain("Audio table entries: 6");
      expect(stdout).toContain("Audio table copy: Absent");
      expect(stdout).toContain("Special OIDs: 7779, 7778");
    }

    {
      const { stdout, stderr } = await tttool("lint", gme);
      expect(stderr).toBeFalsy();
      expect(stdout).toContain(
        'All lines do satisfy hypothesis "play indicies are correct"!',
      );
      expect(stdout).toContain(
        'All lines do satisfy hypothesis "media indicies are correct"!',
      );
    }

    {
      const { stdout, stderr } = await tttool("scripts", gme);
      expect(stderr).toBeFalsy();
      expect(stdout.split(/\r?\n/).join("\n")).toContain(`Script for OID 1401:
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
    0==0? P(5)`);
    }

    {
      const { stdout, stderr } = await tttool(
        "media",
        "--dir",
        join(tmpDir, "media"),
        gme,
      );
      expect(stderr).toBeFalsy();
      expect(stdout).toContain("Audio Table entries: 6");

      // TODO compare audio files byte-by-byte
    }

    {
      const game = await play(gme);
      expect(await game.out).toContain("Initial");
      expect(await game.err).toBeFalsy();
      game.touch(1401);
      expect(await game.out).toContain("Playing audio sample 0");

      await game.exit();
    }
  }, 10000);

  it("should support power on sounds", async () => {
    const gme = join(tmpDir, "data3.gme");
    await buildTo(
      { ...cfg, tracks: await getTestMedia(), powerOnSounds: [0, 1] },
      gme,
    );

    {
      const { stdout, stderr } = await tttool("info", gme);
      console.log("stdout", stdout);
      console.log("stderr", stderr);

      expect(stderr).toBeFalsy();
      expect(stdout).toContain(`Product ID: ${cfg.productId}`);
      expect(stdout).toContain("Initial sounds: [[0,1]]");
    }

    {
      const { stdout, stderr } = await tttool("lint", gme);
      expect(stderr).toBeFalsy();
      expect(stdout).toContain(
        'All lines do satisfy hypothesis "play indicies are correct"!',
      );
      expect(stdout).toContain(
        'All lines do satisfy hypothesis "media indicies are correct"!',
      );
    }
  }, 10000);
});
