import { Button, Checkbox, Flex, Group, Modal } from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useCallback, useState } from "react";
import AlertTriangle from "../components/icons/AlertTriangle";
import Feather from "../components/icons/Feather";
import Printer from "../components/icons/Printer";
import { useOptions } from "../hooks/useOptions";
import { useLibrary } from "../hooks/useLibrary";
import { useI18n } from "../hooks/useI18n";
import { iconStyle } from "../util/constants";
import { type GmeBuildConfig } from "../util/gme/gme";
import { useGmeBuilder } from "../util/gme/useGmeBuilder";

export function DownloadPanel() {
  const {
    productId,
    playAllOid,
    stopOid,
    replayOid,
    penLanguage: language,
    projectName,
    powerOnSoundIndex,
  } = useOptions()[0];
  const i18n = useI18n();
  const {
    value: { tracks },
  } = useLibrary();
  const [isBundling, setIsBundling] = useState(false);

  const { build } = useGmeBuilder();
  const onBundleClick = useCallback(async () => {
    if (tracks.length === 0) return;

    setIsBundling(true);
    try {
      const scripts: GmeBuildConfig["scripts"] = {
        [playAllOid]: [
          {
            conditions: [],
            actions: [
              {
                cmd: "playAllRange",
                param: { value: (tracks.length + 1) | (1 << 8) },
              },
            ],
            playlist: [],
          },
        ],
      };

      const cfg: GmeBuildConfig = {
        tracks,
        productId,
        language,
        scripts,
        stopOid: stopOid,
        replayOid: replayOid,
        powerOnSounds:
          powerOnSoundIndex !== null ? [powerOnSoundIndex] : undefined,
      };

      const handle: FileSystemFileHandle = await window.showSaveFilePicker({
        suggestedName: `Totem - ${projectName}.gme`,
        types: [
          {
            description: "GME",
            accept: {
              "application/gme": [".gme"],
            },
          },
        ],
      });

      const stream = await handle.createWritable();
      await build(cfg).pipeTo(stream);
      notifications.show({
        title: i18n`Success`,
        message: i18n`Saved to disk`,
        autoClose: 10 * 1000,
        icon: <Feather />,
      });
    } catch (e) {
      notifications.show({
        title: i18n`Error`,
        message: String(e),
        autoClose: 10 * 1000,
        icon: <AlertTriangle />,
      });
    } finally {
      setIsBundling(false);
    }
  }, [
    tracks,
    playAllOid,
    stopOid,
    replayOid,
    productId,
    language,
    projectName,
    powerOnSoundIndex,
  ]);

  const [printHintRead, setPrintHintRead] = useLocalStorage({
    key: "print-hint-read",
    defaultValue: false,
  });
  const [printHintOpened, { open: openPrintHint, close: closePrintHint }] =
    useDisclosure(false);

  const onPrintClick = useCallback(() => {
    if (printHintRead) {
      window.print();
    } else {
      openPrintHint();
    }
  }, [printHintRead]);

  const onPrintHintClose = useCallback(() => {
    closePrintHint();
    setTimeout(() => window.print(), 1);
  }, [closePrintHint]);

  return (
    <>
      <Group gap={4}>
        <Button
          pr={8}
          disabled={tracks.length === 0}
          onClick={onBundleClick}
          loading={isBundling}
          leftSection={<Feather {...iconStyle} />}
        >
          {i18n`Save to tiptoi`}
        </Button>
        <Button
          pr={8}
          disabled={isBundling || tracks.length === 0}
          onClick={onPrintClick}
          leftSection={<Printer {...iconStyle} />}
        >
          {i18n`Print`}
        </Button>
      </Group>

      <Modal
        withCloseButton={false}
        opened={printHintOpened}
        onClose={onPrintHintClose}
        title={i18n`Print`}
        centered
      >
        {i18n`For optimal results in chrome, make sure to open 'More Settings' in the print dialog and then:`}
        <ul>
          <li>{i18n`Uncheck 'Headers and footers'`}</li>
          <li>{i18n`Check 'Background graphics'`}</li>
        </ul>

        <Flex gap="xs" align={"center"}>
          <Checkbox
            label={i18n`Do not show again`}
            onChange={(e) => setPrintHintRead(e.target.checked)}
          ></Checkbox>
          <Flex style={{ flexGrow: 1 }}></Flex>
          <Button onClick={onPrintHintClose}>{i18n`OK`}</Button>
        </Flex>
      </Modal>
    </>
  );
}
