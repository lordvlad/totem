import { ActionIcon, Box, Button, Group, Modal, Tooltip } from "@mantine/core";
import { useCallback, useEffect, useRef } from "react";
import { useI18n } from "../hooks/useI18n";
import { useRecorder } from "../hooks/useRecorder";
import Mic from "./icons/Mic";
import { CircleStop } from "./icons/CircleStop";
import { CirclePlay } from "./icons/CirclePlay";
import Pause from "./icons/Pause";

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
  const actionButtonRef = useRef<HTMLButtonElement>(null);

  const recorder = useRecorder(
    i18n`Recording Error`,
    i18n`Microphone access denied. Please allow microphone permissions and try again.`,
    i18n`Failed to start recording. Please check your microphone and try again.`,
    i18n`Failed to convert recording to MP3. Please try again.`,
  );

  const {
    recordingState,
    playbackState,
    audioBlob,
    audioUrl,
    volumeLevel,
    startRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    resumePlayback,
    reset,
  } = recorder;

  useEffect(() => {
    if (opened) {
      setTimeout(() => {
        actionButtonRef.current?.focus();
      }, 100);
    }
  }, [opened]);

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
    reset();
    setTimeout(() => {
      actionButtonRef.current?.focus();
    }, 0);
  }, [reset]);

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
