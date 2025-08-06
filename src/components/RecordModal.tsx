import { Button, Group, Modal, ActionIcon, Tooltip, Box } from "@mantine/core";
import { useI18n } from "../hooks/useI18n";
import { Record } from "./icons/Record";
import { CircleStop } from "./icons/CircleStop";
import { CirclePlay } from "./icons/CirclePlay";
import { Pause } from "./icons/Pause";
import { useState, useRef, useEffect, useCallback } from "react";
import vmsg from "vmsg";
import { useLibrary } from "../hooks/useLibrary";

type RecordModalProps = {
  opened: boolean;
  onClose: () => void;
};

const recorder = new vmsg.Recorder({
  wasmURL: "https://unpkg.com/vmsg@0.4.0/vmsg.wasm",
});

enum RecordingState {
  Idle,
  Recording,
  Recorded,
  Playing,
  Paused,
}

function PulsatingCircle({ size }: { size: number }) {
  return (
    <Box
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${size})`,
        width: 128,
        height: 128,
        borderRadius: "50%",
        backgroundColor: "rgba(0, 128, 255, 0.2)",
        transition: "transform 0.1s ease-out",
        zIndex: -1,
      }}
    />
  );
}

export function RecordModal({ opened, onClose }: RecordModalProps) {
  const i18n = useI18n();
  const { add } = useLibrary();
  const [state, setState] = useState(RecordingState.Idle);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [volume, setVolume] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const animationFrameRef = useRef<number>();

  const reset = () => {
    setState(RecordingState.Idle);
    setAudioUrl(null);
    setAudioBlob(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const startRecording = async () => {
    try {
      await recorder.initAudio();
      await recorder.startRecording();
      setState(RecordingState.Recording);
    } catch (e) {
      console.error(e);
    }
  };

  const stopRecording = async () => {
    const blob = await recorder.stopRecording();
    setAudioBlob(blob);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setState(RecordingState.Recorded);
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (state === RecordingState.Playing) {
        audioRef.current.pause();
        setState(RecordingState.Paused);
      } else {
        audioRef.current.play();
        setState(RecordingState.Playing);
      }
    }
  };

  const onActionButtonClick = () => {
    switch (state) {
      case RecordingState.Idle:
        startRecording();
        break;
      case RecordingState.Recording:
        stopRecording();
        break;
      case RecordingState.Recorded:
      case RecordingState.Paused:
        togglePlayback();
        break;
      case RecordingState.Playing:
        togglePlayback();
        break;
    }
  };

  useEffect(() => {
    if (opened) {
      actionButtonRef.current?.focus();
    }
  }, [opened]);

  const updateVolume = useCallback(() => {
    const volume = recorder.getMicVolume();
    setVolume(volume);
    animationFrameRef.current = requestAnimationFrame(updateVolume);
  }, []);

  useEffect(() => {
    if (state === RecordingState.Recording) {
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setVolume(0);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, updateVolume]);

  const handleAdd = async () => {
    if (audioBlob) {
      const file = new File([audioBlob], `recording-${Date.now()}.mp3`, {
        type: "audio/mpeg",
      });
      await add([file]);
    }
  };

  const handleAddAndRecordAgain = async () => {
    await handleAdd();
    reset();
  };

  const handleAddAndClose = async () => {
    await handleAdd();
    handleClose();
  };

  const getButtonProps = () => {
    switch (state) {
      case RecordingState.Idle:
        return {
          label: i18n`Start Recording`,
          icon: <Record />,
          color: "red",
        };
      case RecordingState.Recording:
        return {
          label: i18n`Stop Recording`,
          icon: <CircleStop />,
          color: "red",
        };
      case RecordingState.Recorded:
      case RecordingState.Paused:
        return {
          label: i18n`Play Recording`,
          icon: <CirclePlay />,
          color: "blue",
        };
      case RecordingState.Playing:
        return {
          label: i18n`Pause Recording`,
          icon: <Pause />,
          color: "blue",
        };
    }
  };

  const { label, icon, color } = getButtonProps();

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={i18n`Record Audio`}
      size="lg"
    >
      <Box
        style={{
          textAlign: "center",
          position: "relative",
          height: 128,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PulsatingCircle size={volume} />
        <Tooltip label={label}>
          <ActionIcon
            ref={actionButtonRef}
            size={128}
            radius="xl"
            variant="filled"
            color={color}
            onClick={onActionButtonClick}
          >
            {icon}
          </ActionIcon>
        </Tooltip>
      </Box>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          style={{ width: "100%", marginTop: "20px" }}
          onPlay={() => {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaElementSource(
              audioRef.current!,
            );
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 32;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            const update = () => {
              analyser.getByteFrequencyData(dataArray);
              const average =
                dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
              setVolume(average / 128);
              animationFrameRef.current = requestAnimationFrame(update);
            };
            animationFrameRef.current = requestAnimationFrame(update);
          }}
          onPause={() => {
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
            }
            setVolume(0);
          }}
          onEnded={() => {
            setState(RecordingState.Recorded);
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
            }
            setVolume(0);
          }}
        />
      )}

      <Group mt="xl" style={{ justifyContent: "flex-end" }}>
        <Button variant="outline" onClick={reset}>{i18n`Reset`}</Button>
        <Button
          disabled={!audioUrl}
          onClick={handleAddAndClose}
        >{i18n`Add`}</Button>
        <Button
          disabled={!audioUrl}
          onClick={handleAddAndRecordAgain}
        >{i18n`Add and record again`}</Button>
      </Group>
    </Modal>
  );
}
