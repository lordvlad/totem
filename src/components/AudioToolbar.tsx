/// <reference types="@types/wicg-file-system-access" />

import { Button, Flex, Kbd } from "@mantine/core";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import Music2 from "../components/icons/Music2";
import Trash from "../components/icons/Trash";
import Mic from "../components/icons/Mic";
import { useLibrary } from "../hooks/useLibrary";
import { useSelection } from "../hooks/selection";
import { iconStyle, kbdStyle } from "../util/constants";
import { useI18n } from "../hooks/useI18n";
import { RecordingModal } from "./RecordingModal";

export function AudioToolbar() {
  const i18n = useI18n();
  const { selected, reset } = useSelection();
  const {
    value: { tracks, isLoading },
    load,
    remove,
    clear,
  } = useLibrary();

  const [
    recordingModalOpened,
    { open: openRecordingModal, close: closeRecordingModal },
  ] = useDisclosure(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedFilename, setRecordedFilename] = useState<string | null>(null);

  const onDeleteSelection = useCallback(() => {
    const selectedTracks = tracks.filter((_, idx) => selected.has(idx));
    reset();
    remove(...selectedTracks);
  }, [selected, tracks]);

  const onChooseFilesClick = async () => {
    const opts = {
      multiple: true,
      types: [
        { description: i18n`Audio`, accept: { "audio/*": [".mp3" as const] } },
      ],
    };
    const handles: FileSystemFileHandle[] =
      await window.showOpenFilePicker(opts);
    load(handles);
  };

  const onRecordingAdd = useCallback((blob: Blob, filename: string) => {
    setRecordedBlob(blob);
    setRecordedFilename(filename);
  }, []);

  useEffect(() => {
    if (recordedBlob && recordedFilename) {
      const file = new File([recordedBlob], recordedFilename, {
        type: "audio/mp3",
      });
      const handle = {
        kind: "file" as const,
        name: recordedFilename,
        getFile: async () => file,
      } as FileSystemFileHandle;

      load([handle]);
      setRecordedBlob(null);
      setRecordedFilename(null);
    }
  }, [recordedBlob, recordedFilename, load]);

  // useHotkeys will be set up ONCE only, so we need to work around it having a stale
  // reference to onDeleteSelection
  const r = useRef<(() => void) | null>(null);
  useEffect(() => {
    r.current = onDeleteSelection;
  }, [selected, tracks]);

  useHotkeys([
    ["mod+o", async () => await onChooseFilesClick()],
    ["mod+Delete", () => clear()],
    ["Delete", () => r.current?.()],
    ["mod+shift+r", () => openRecordingModal()],
  ]);

  return (
    <>
      <Flex gap="xs" wrap="wrap">
        <Button
          disabled={isLoading}
          loading={isLoading}
          onClick={onChooseFilesClick}
          leftSection={<Music2 {...iconStyle} />}
          pr={8}
        >
          {tracks.length > 0 ? i18n`Add more` : i18n`Choose Files`}
          <Kbd ml={8}>{i18n`ctrl + O`}</Kbd>
        </Button>
        <Button
          pr={8}
          disabled={isLoading}
          onClick={openRecordingModal}
          leftSection={<Mic {...iconStyle} />}
        >
          {i18n`Record`}
          <Kbd ml={8}>{i18n`ctrl + shift + R`}</Kbd>
        </Button>
        <Button
          pr={8}
          disabled={isLoading || tracks.length === 0}
          onClick={() => (selected.size ? onDeleteSelection() : clear())}
          leftSection={<Trash {...iconStyle} />}
        >
          {selected.size ? i18n`Remove` : i18n`Clear`}
          <Kbd {...kbdStyle}>{selected.size ? i18n`del` : "ctrl + del"}</Kbd>
        </Button>
      </Flex>

      <RecordingModal
        opened={recordingModalOpened}
        onClose={closeRecordingModal}
        onAdd={onRecordingAdd}
      />
    </>
  );
}
