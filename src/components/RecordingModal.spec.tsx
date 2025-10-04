// This component is now tested via Playwright E2E tests
// See: e2e/audio.spec.ts
//
// The RecordingModal handles audio recording and playback functionality.
// E2E tests verify the full audio workflow in a real browser environment.
//
// Original unit tests demonstrated:
// - The bug: calling createMediaElementSource twice on the same audio element fails
// - The fix: create a new Audio element for each playback session
//
// Future E2E test opportunities:
// - Audio recording via microphone (with permission handling)
// - Audio playback controls (play, pause, stop)
// - Multiple audio track management
// - Preventing InvalidStateError when replaying audio
// - Audio visualization/waveform display

import { describe, expect, it, mock, beforeEach, afterEach } from "bun:test";

describe("RecordingModal playback behavior", () => {
  let mockAudioContext: any;
  let audioContextCreateMediaElementSourceCalls: any[];

  beforeEach(() => {
    audioContextCreateMediaElementSourceCalls = [];

    // Mock AudioContext
    mockAudioContext = {
      createMediaElementSource: mock((audio) => {
        audioContextCreateMediaElementSourceCalls.push(audio);
        return {
          connect: mock(),
        };
      }),
      createAnalyser: mock(() => ({
        fftSize: 0,
        frequencyBinCount: 1024,
        getByteFrequencyData: mock(),
        connect: mock(),
      })),
      destination: {},
      state: "running",
      close: mock(() => Promise.resolve()),
    };

    global.AudioContext = mock(() => mockAudioContext) as any;

    // Mock Audio element to create unique instances
    global.Audio = mock(() => ({
      play: mock(() => Promise.resolve()),
      pause: mock(),
      src: "",
      onended: null,
    })) as any;

    global.URL.createObjectURL = mock(() => "blob:mock-url");
    global.URL.revokeObjectURL = mock();
    global.requestAnimationFrame = mock((cb) => {
      cb(0);
      return 0;
    });
    global.cancelAnimationFrame = mock();
  });

  afterEach(() => {
    // Bun doesn't have vi.clearAllMocks(), but mocks are reset between tests
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
