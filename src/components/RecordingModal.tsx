import { ActionIcon, Box, Button, Group, Modal, Tooltip } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "../hooks/useI18n";
import Mic from "./icons/Mic";
import { CircleStop } from "./icons/CircleStop";
import { CirclePlay } from "./icons/CirclePlay";
import Pause from "./icons/Pause";
import lamejs from "lamejs";

type RecordingState = "idle" | "recording" | "recorded";
type PlaybackState = "idle" | "playing" | "paused";

interface RecordingModalProps {
  opened: boolean;
  onClose: () => void;
  onAdd: (audioBlob: Blob, filename: string) => void;
}

export function RecordingModal({
  opened,
  onClose,
  onAdd,
}: RecordingModalProps) {
  const i18n = useI18n();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const actionButtonRef = useRef<HTMLButtonElement>(null);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
  }, [audioUrl]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  useEffect(() => {
    if (opened) {
      setTimeout(() => {
        actionButtonRef.current?.focus();
      }, 100);
    }
  }, [opened]);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setVolumeLevel(average / 255);

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, []);

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

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const mp3Blob = await convertToMp3(audioBlob);

        setAudioBlob(mp3Blob);
        const url = URL.createObjectURL(mp3Blob);
        setAudioUrl(url);
        setRecordingState("recorded");
        setVolumeLevel(0);

        if (audioContextRef.current?.state !== "closed") {
          await audioContextRef.current?.close();
        }
        audioContextRef.current = null;
        analyserRef.current = null;
      };

      mediaRecorder.start();
      setRecordingState("recording");
      analyzeAudio();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [analyzeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const convertToMp3 = async (audioBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0);

    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
    const mp3Data: Int8Array[] = [];

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
      concatenated.set(new Uint8Array(arr.buffer), offset);
      offset += arr.length;
    }

    return new Blob([concatenated], { type: "audio/mp3" });
  };

  const playRecording = useCallback(() => {
    if (!audioUrl) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }

    const audio = audioElementRef.current;
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
      audioContextRef.current = null;
      analyserRef.current = null;
    };

    audio.play();
    setPlaybackState("playing");
    analyzeAudio();
  }, [audioUrl, analyzeAudio]);

  const pausePlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setPlaybackState("paused");
      setVolumeLevel(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, []);

  const resumePlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.play();
      setPlaybackState("playing");
      analyzeAudio();
    }
  }, [analyzeAudio]);

  const handleActionClick = useCallback(() => {
    if (recordingState === "idle") {
      startRecording();
    } else if (recordingState === "recording") {
      stopRecording();
    } else if (recordingState === "recorded") {
      if (playbackState === "idle" || playbackState === "paused") {
        if (playbackState === "paused") {
          resumePlayback();
        } else {
          playRecording();
        }
      } else if (playbackState === "playing") {
        pausePlayback();
      }
    }
  }, [
    recordingState,
    playbackState,
    startRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    resumePlayback,
  ]);

  const handleReset = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingState("idle");
    setPlaybackState("idle");
    setVolumeLevel(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setTimeout(() => {
      actionButtonRef.current?.focus();
    }, 0);
  }, [audioUrl]);

  const handleAdd = useCallback(() => {
    if (audioBlob) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `recording-${timestamp}.mp3`;
      onAdd(audioBlob, filename);
      handleReset();
      onClose();
    }
  }, [audioBlob, onAdd, onClose, handleReset]);

  const handleAddAndRecordAgain = useCallback(() => {
    if (audioBlob) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `recording-${timestamp}.mp3`;
      onAdd(audioBlob, filename);
      handleReset();
    }
  }, [audioBlob, onAdd, handleReset]);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const getActionIcon = () => {
    const iconSize = { width: 64, height: 64 };
    if (recordingState === "idle") return <Mic {...iconSize} />;
    if (recordingState === "recording") return <CircleStop {...iconSize} />;
    if (playbackState === "playing") return <Pause {...iconSize} />;
    return <CirclePlay {...iconSize} />;
  };

  const getTooltip = () => {
    if (recordingState === "idle") return i18n`Start recording`;
    if (recordingState === "recording") return i18n`Stop recording`;
    if (playbackState === "playing") return i18n`Pause playback`;
    return i18n`Play recording`;
  };

  const scale = 1 + volumeLevel * 0.5;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={i18n`Record Audio`}
      centered
      size="lg"
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <Box
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            style={{
              position: "absolute",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              backgroundColor: "var(--mantine-color-blue-1)",
              transform: `scale(${scale})`,
              transition: "transform 0.1s ease-out",
              opacity: volumeLevel > 0 ? 0.6 : 0,
            }}
          />
          <Tooltip label={getTooltip()} position="bottom">
            <ActionIcon
              ref={actionButtonRef}
              size={80}
              radius="xl"
              variant="filled"
              onClick={handleActionClick}
              style={{ position: "relative", zIndex: 1 }}
            >
              {getActionIcon()}
            </ActionIcon>
          </Tooltip>
        </Box>

        {recordingState === "recorded" && audioUrl && (
          <audio controls src={audioUrl} style={{ width: "100%" }} />
        )}
      </Box>

      <Group mt="xl" style={{ justifyContent: "flex-end" }}>
        <Button variant="default" onClick={handleReset} disabled={!audioBlob}>
          {i18n`Reset`}
        </Button>
        <Button onClick={handleAddAndRecordAgain} disabled={!audioBlob}>
          {i18n`Add and record again`}
        </Button>
        <Button onClick={handleAdd} disabled={!audioBlob}>
          {i18n`Add`}
        </Button>
      </Group>
    </Modal>
  );
}
