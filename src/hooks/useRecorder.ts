import { useCallback, useEffect, useRef, useState } from "react";
import lamejs from "@breezystack/lamejs";

type RecordingState = "idle" | "recording" | "recorded" | "error";
type PlaybackState = "idle" | "playing" | "paused" | "error";

export class RecorderError extends Error {
  type: "recording" | "playback" | "conversion" | "permission";

  constructor(
    type: "recording" | "playback" | "conversion" | "permission",
    message: string,
  ) {
    super(message);
    this.name = "RecorderError";
    this.type = type;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, RecorderError);
    }
  }
}

interface UseRecorderReturn {
  recordingState: RecordingState;
  playbackState: PlaybackState;
  audioBlob: Blob | null;
  audioUrl: string | null;
  volumeLevel: number;
  error: RecorderError | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playRecording: () => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  reset: () => void;
  clearError: () => void;
}

export function useRecorder(): UseRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<RecorderError | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const analyzeAudio = useCallback(() => {
    if (analyserRef.current == null) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setVolumeLevel(average / 255);

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, []);

  // eslint-disable-next-line complexity -- MP3 conversion requires multiple steps
  const convertToMp3 = async (audioBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0);

    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
    const mp3Data: Uint8Array[] = [];

    const sampleBlockSize = 1152;
    const int16Samples = new Int16Array(samples.length);

    for (let i = 0; i < samples.length; i++) {
      int16Samples[i] =
        samples[i] < 0 ? samples[i] * 0x8000 : samples[i] * 0x7fff;
    }

    for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
      const left = int16Samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(left);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    await audioContext.close();

    const totalLength = mp3Data.reduce((acc, arr) => acc + arr.length, 0);
    const concatenated = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of mp3Data) {
      concatenated.set(arr, offset);
      offset += arr.length;
    }

    return new Blob([concatenated], { type: "audio/mp3" });
  };

  // eslint-disable-next-line complexity -- Cleanup requires multiple steps
  const cleanup = useCallback(() => {
    if (animationFrameRef.current != null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (
      audioContextRef.current != null &&
      audioContextRef.current.state !== "closed"
    ) {
      void audioContextRef.current.close();
    }
    if (audioUrl !== null && audioUrl !== "") {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioElementRef.current != null) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
    }
    if (
      mediaRecorderRef.current != null &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
  }, [audioUrl]);

  useEffect(() => cleanup, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          const mp3Blob = await convertToMp3(audioBlob);

          setAudioBlob(mp3Blob);
          const url = URL.createObjectURL(mp3Blob);
          setAudioUrl(url);
          setRecordingState("recorded");
          setVolumeLevel(0);

          if (
            audioContextRef.current != null &&
            audioContextRef.current.state !== "closed"
          ) {
            await audioContextRef.current.close();
          }
          audioContextRef.current = null;
          analyserRef.current = null;
        } catch (error) {
          console.error("Error converting recording to MP3:", error);
          setRecordingState("error");
          setError(
            new RecorderError(
              "conversion",
              error instanceof Error
                ? error.message
                : "Failed to convert audio to MP3",
            ),
          );
          setVolumeLevel(0);
        }
      };

      mediaRecorder.start();
      setRecordingState("recording");
      analyzeAudio();
    } catch (error) {
      console.error("Error starting recording:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isPermissionError =
        errorMessage.includes("Permission denied") ||
        errorMessage.includes("NotAllowedError");
      setRecordingState("error");
      setError(
        new RecorderError(
          isPermissionError ? "permission" : "recording",
          errorMessage,
        ),
      );
    }
  }, [analyzeAudio]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current != null &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current != null && animationFrameRef.current !== 0) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const playRecording = useCallback(() => {
    if (audioUrl === null || audioUrl === "") return;

    // Always create a new Audio element for playback to avoid
    // "InvalidStateError: The HTMLMediaElement has already been connected to a different AudioContext"
    const audio = new Audio();
    audioElementRef.current = audio;
    audio.src = audioUrl;

    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaElementSource(audio);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    audio.onended = () => {
      setPlaybackState("idle");
      setVolumeLevel(0);
      if (
        animationFrameRef.current != null &&
        animationFrameRef.current !== 0
      ) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (
        audioContextRef.current != null &&
        audioContextRef.current.state !== "closed"
      ) {
        void audioContextRef.current.close();
      }
      audioContextRef.current = null;
      analyserRef.current = null;
    };

    void audio.play();
    setPlaybackState("playing");
    analyzeAudio();
  }, [audioUrl, analyzeAudio]);

  const pausePlayback = useCallback(() => {
    if (audioElementRef.current != null) {
      audioElementRef.current.pause();
      setPlaybackState("paused");
      setVolumeLevel(0);
      if (
        animationFrameRef.current != null &&
        animationFrameRef.current !== 0
      ) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, []);

  const resumePlayback = useCallback(() => {
    if (audioElementRef.current != null) {
      void audioElementRef.current.play();
      setPlaybackState("playing");
      analyzeAudio();
    }
  }, [analyzeAudio]);

  // eslint-disable-next-line complexity -- Reset requires multiple steps
  const reset = useCallback(() => {
    if (audioElementRef.current != null) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
    }
    if (audioUrl !== null && audioUrl !== "") {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingState("idle");
    setPlaybackState("idle");
    setVolumeLevel(0);
    setError(null);
    if (animationFrameRef.current != null && animationFrameRef.current !== 0) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [audioUrl]);

  const clearError = useCallback(() => {
    setError(null);
    if (recordingState === "error") {
      setRecordingState("idle");
    }
    if (playbackState === "error") {
      setPlaybackState("idle");
    }
  }, [recordingState, playbackState]);

  return {
    recordingState,
    playbackState,
    audioBlob,
    audioUrl,
    volumeLevel,
    error,
    startRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    resumePlayback,
    reset,
    clearError,
  };
}
