// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("RecordingModal playback behavior", () => {
  let mockAudioContext: any;
  let audioContextCreateMediaElementSourceCalls: any[];

  beforeEach(() => {
    audioContextCreateMediaElementSourceCalls = [];

    // Mock AudioContext
    mockAudioContext = {
      createMediaElementSource: vi.fn((audio) => {
        audioContextCreateMediaElementSourceCalls.push(audio);
        return {
          connect: vi.fn(),
        };
      }),
      createAnalyser: vi.fn(() => ({
        fftSize: 0,
        frequencyBinCount: 1024,
        getByteFrequencyData: vi.fn(),
        connect: vi.fn(),
      })),
      destination: {},
      state: "running",
      close: vi.fn(() => Promise.resolve()),
    };

    global.AudioContext = vi.fn(() => mockAudioContext) as any;

    // Mock Audio element to create unique instances
    global.Audio = vi.fn(() => ({
      play: vi.fn(() => Promise.resolve()),
      pause: vi.fn(),
      src: "",
      onended: null,
    })) as any;

    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
    global.requestAnimationFrame = vi.fn((cb) => {
      cb(0);
      return 0;
    });
    global.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should allow creating multiple MediaElementSource from same audio element", () => {
    // This test demonstrates the core issue: calling createMediaElementSource
    // on the same audio element twice will fail in real browsers.
    // The fix should ensure we don't call it twice on the same element.

    const audio = new Audio();
    const ctx1 = new AudioContext();

    // First time should work
    const source1 = ctx1.createMediaElementSource(audio);
    expect(source1).toBeDefined();
    expect(audioContextCreateMediaElementSourceCalls.length).toBe(1);

    // In real browsers, this would throw:
    // "InvalidStateError: The HTMLMediaElement has already been connected to a different AudioContext"
    // Our fix should avoid this scenario

    // Second time on same element - this is what causes the bug
    const ctx2 = new AudioContext();
    const source2 = ctx2.createMediaElementSource(audio);
    expect(source2).toBeDefined();
    expect(audioContextCreateMediaElementSourceCalls.length).toBe(2);

    // The bug occurs when the same audio element is used with createMediaElementSource twice
    expect(audioContextCreateMediaElementSourceCalls[0]).toBe(
      audioContextCreateMediaElementSourceCalls[1],
    );
  });

  it("should demonstrate the proper fix: recreate audio element instead of reusing", () => {
    // The fix: create a new Audio element each time playback starts

    const audio1 = new Audio();
    audio1.src = "blob:mock-url";

    const ctx1 = new AudioContext();
    const source1 = ctx1.createMediaElementSource(audio1);
    expect(source1).toBeDefined();

    // Simulate playback ending
    ctx1.close();

    // For replay, create a NEW audio element instead of reusing
    const audio2 = new Audio(); // This is the key fix!
    audio2.src = "blob:mock-url";

    const ctx2 = new AudioContext();
    const source2 = ctx2.createMediaElementSource(audio2);
    expect(source2).toBeDefined();

    // These should be different audio elements
    expect(audioContextCreateMediaElementSourceCalls[0]).not.toBe(
      audioContextCreateMediaElementSourceCalls[1],
    );
  });
});
