import { describe, it, expect } from "bun:test";
import { Track } from "./track";

describe("Track", () => {
  describe("title getter", () => {
    it("should return title from metadata when present", () => {
      const track = new Track();
      // @ts-expect-error -- setting readonly property for test
      track.fileName = "test-audio.mp3";
      track.title = "My Song Title";

      expect(track.title).toBe("My Song Title");
    });

    it("should fallback to filename without extension when title is undefined", () => {
      const track = new Track();
      // @ts-expect-error -- setting readonly property for test
      track.fileName = "my-audio-file.mp3";

      expect(track.title).toBe("my-audio-file");
    });

    it("should fallback to filename without extension for various file types", () => {
      const track1 = new Track();
      // @ts-expect-error -- setting readonly property for test
      track1.fileName = "song.ogg";
      expect(track1.title).toBe("song");

      const track2 = new Track();
      // @ts-expect-error -- setting readonly property for test
      track2.fileName = "audio.wav";
      expect(track2.title).toBe("audio");

      const track3 = new Track();
      // @ts-expect-error -- setting readonly property for test
      track3.fileName = "music.m4a";
      expect(track3.title).toBe("music");
    });

    it("should handle filenames with multiple dots correctly", () => {
      const track = new Track();
      // @ts-expect-error -- setting readonly property for test
      track.fileName = "my.song.title.mp3";

      expect(track.title).toBe("my.song.title");
    });

    it("should return undefined when both title and fileName are empty", () => {
      const track = new Track();

      expect(track.title).toBeUndefined();
    });

    it("should fallback to filename when title is empty string", () => {
      const track = new Track();
      // @ts-expect-error -- setting readonly property for test
      track.fileName = "empty-title.mp3";
      track.title = "";

      expect(track.title).toBe("empty-title");
    });
  });
});
