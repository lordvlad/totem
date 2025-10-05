import { Button, Checkbox, Flex, Group, Modal } from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useCallback, useState } from "react";
import AlertTriangle from "../components/icons/AlertTriangle";
import Feather from "../components/icons/Feather";
import Printer from "../components/icons/Printer";
import TestTube from "../components/icons/TestTube";
import { Download } from "../components/icons/Download";
import { useOptions } from "../hooks/useOptions";
import { useLibrary } from "../hooks/useLibrary";
import { useI18n } from "../hooks/useI18n";
import { iconStyle } from "../util/constants";
import { type GmeBuildConfig } from "../util/gme/gme";
import { useGmeBuilder } from "../util/gme/useGmeBuilder";
import { showSaveFilePicker } from "../util/fileSystemFallback";
import {
  activateTestPrintMode,
  deactivateTestPrintMode,
} from "../hooks/useTestPrintMode";
import { Track } from "../util/mp3/track";
import { hydrate } from "../util/hydrate";
import { id } from "tsafe";

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

      const handle = await showSaveFilePicker({
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

  const onTestPrintClick = useCallback(() => {
    activateTestPrintMode();
    document.body.classList.add("test-print-mode");
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        deactivateTestPrintMode();
        document.body.classList.remove("test-print-mode");
      }, 100);
    }, 1);
  }, []);

  const onTestGmeClick = useCallback(async () => {
    setIsBundling(true);
    try {
      const testProductId = 950;

      const helloAudioUrl = new URL(
        "../util/gme/__specs__/hello.ogg",
        import.meta.url,
      ).href;
      const helloResponse = await fetch(helloAudioUrl);
      const helloBlob = await helloResponse.blob();

      const helloTrack = id<Track>(
        hydrate(
          {
            title: "Test Sound",
            artist: "Totem",
            album: "Test",
            fileName: "hello.ogg",
            uuid: crypto.randomUUID(),
            size: helloBlob.size,
          },
          Track,
        ),
      );

      const cfg: GmeBuildConfig = {
        tracks: [helloTrack],
        productId: testProductId,
        language,
        powerOnSounds: [0],
      };

      const handle = await showSaveFilePicker({
        suggestedName: `Totem - Test - Product ${testProductId}.gme`,
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
        message: i18n`Test GME file saved. Copy it to your tiptoi pen.`,
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
  }, [language, build, i18n]);

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

      <Group gap={4} mt="xs">
        <Button
          pr={8}
          onClick={onTestGmeClick}
          loading={isBundling}
          variant="light"
          leftSection={<Download {...iconStyle} />}
        >
          {i18n`Download Test GME`}
        </Button>
        <Button
          pr={8}
          disabled={isBundling}
          onClick={onTestPrintClick}
          variant="light"
          leftSection={<TestTube {...iconStyle} />}
        >
          {i18n`Print Test Page`}
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
