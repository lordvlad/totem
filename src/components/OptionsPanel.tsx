import { Button, Checkbox, Group, NumberInput, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { clear, get, keys, set } from "idb-keyval";
import debounce from "lodash.debounce";
import { useCallback, useEffect } from "react";
import { FormField } from "../components/FormField";
import { Download } from "../components/icons/Download";
import Trash from "../components/icons/Trash";
import { Upload } from "../components/icons/Upload";
import { useI18n } from "../hooks/useI18n/useI18n";
import { useLibrary } from "../hooks/useLibrary";
import { useOptions } from "../hooks/useOptions";
import { iconStyle } from "../util/constants";
import { useAlert } from "./Alert";
import { useConfirm } from "./Confirm";

function uInt8ArrayToBase64(typedArray: Uint8Array): string {
  let binary = "";
  const len = typedArray.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(typedArray[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function OptionsPanel() {
  const { alert, element: alertHandle } = useAlert();
  const i18n = useI18n();
  const [options, setOptions] = useOptions();
  const {
    value: { tracks },
  } = useLibrary();
  const form = useForm({
    initialValues: { ...options },
    onValuesChange: useCallback(
      debounce((values) => setOptions(values), 300),
      [],
    ),
  });

  useEffect(() => {
    form.setValues(options);
  }, [options]);

  const saveProject = useCallback(async () => {
    const handle: FileSystemFileHandle = await window.showSaveFilePicker({
      suggestedName: `Totem - ${options.projectName}.ndjson`,
      types: [
        {
          description: "Json Lines",
          accept: {
            "application/jsonlines": [".ndjson"],
          },
        },
      ],
    });

    const notificationId = notifications.show({
      loading: true,
      message: i18n`Downloading...`,
    });

    const stream = await handle.createWritable();
    const writer = stream.getWriter();
    for (const k of (await keys()) as string[]) {
      const data = await get(k);
      writer.write(
        JSON.stringify([k, data], (_key, value) => {
          if (value instanceof Uint8Array)
            return "uint8array:base64:" + uInt8ArrayToBase64(value);
          if (value instanceof ArrayBuffer)
            return (
              "arraybuffer:base64:" + uInt8ArrayToBase64(new Uint8Array(value))
            );
          return value;
        }),
      );
      writer.write("\n");
    }
    writer.close();

    notifications.hide(notificationId);

    notifications.show({ message: i18n`Project downloaded to ${handle.name}` });
  }, [tracks, options, i18n]);

  const openProject = useCallback(async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Json Lines",
            accept: {
              "application/jsonlines": [".ndjson"],
            },
          },
        ],
      });

      notifications.show({
        loading: true,
        message: i18n`Loading ${fileHandle.name}`,
      });

      const file = await fileHandle.getFile();
      const reader = file.stream().getReader();
      const decoder = new TextDecoder("utf-8");
      let { value, done } = await reader.read();
      let partialLine = "";

      while (!done) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = (partialLine + chunk).split("\n");
        partialLine = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            const [key, data] = JSON.parse(
              line,
              (_k: string, value: unknown) => {
                if (typeof value === "string") {
                  if (value.startsWith("uint8array:base64:"))
                    return fromBase64(
                      value.substring("uint8array:base64:".length),
                    );
                  if (value.startsWith("arraybuffer:base64:"))
                    return fromBase64(
                      value.substring("arraybuffer:base64:".length),
                    ).buffer;
                }
                return value;
              },
            );
            await set(key, data);
          }
        }

        ({ value, done } = await reader.read());
      }

      if (partialLine.trim()) {
        const [key, data] = JSON.parse(partialLine);
        if (key.startsWith("data")) {
          const binaryString = atob(data);
          const uint8Array = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
          }
          await set(key, uint8Array);
        } else {
          await set(key, data);
        }
      }

      window.location.reload();
    } catch (error) {
      alert(i18n`Failed to open project: ${(error as Error).message}`);
    }
  }, [alert, i18n]);

  const { confirm, element: confirmHandle } = useConfirm();

  const deleteProject = () => {
    confirm(i18n`Are you sure you want to delete this project?`).then(
      (confirmed) => {
        if (!confirmed) return;
        return clear().then(() => {
          localStorage.removeItem("options");
          window.location.reload();
        });
      },
    );
  };

  return (
    <>
      {alertHandle}
      {confirmHandle}
      <FormField label={i18n`Project Name`}>
        <TextInput mt={0.75} {...form.getInputProps("projectName")} />
      </FormField>

      <FormField label={""}>
        <Group gap={4}>
          <Button
            leftSection={<Download {...iconStyle} />}
            onClick={saveProject}
          >
            {i18n`Save Project`}
          </Button>
          <Button leftSection={<Upload {...iconStyle} />} onClick={openProject}>
            {i18n`Open Project`}
          </Button>
          <Button
            color="red"
            onClick={deleteProject}
            leftSection={<Trash {...iconStyle} />}
          >
            {i18n`Delete Project`}
          </Button>
        </Group>
      </FormField>

      <FormField
        label={i18n`Product ID`}
        tooltip={i18n`ID of the product. Used to generate the OID codes.`}
      >
        <NumberInput
          min={1}
          max={1000}
          mt={0.75}
          {...form.getInputProps("productId")}
        />
      </FormField>

      <FormField
        label={i18n`OID Code Resolution`}
        tooltip={i18n`Resolution at which OID codes will be generated.`}
      >
        <NumberInput
          mt={0.75}
          {...form.getInputProps("oidCodeResolution")}
          rightSection="DPI"
        />
      </FormField>

      <FormField
        label={i18n`OID Pixel Size`}
        tooltip={i18n`Number of pixels (squared) for each dot in the OID code.`}
      >
        <NumberInput
          mt={0.75}
          {...form.getInputProps("oidCodePixelSize")}
          rightSection="px"
        />
      </FormField>

      <FormField
        label={i18n`"Play All" Code`}
        tooltip={i18n`OID code that will trigger the playback of all tracks.`}
      >
        <NumberInput
          min={1}
          max={0xffff}
          mt={0.75}
          {...form.getInputProps("playAllOid")}
        />
      </FormField>

      <FormField
        label={i18n`Replay Code`}
        tooltip={i18n`OID code that will trigger the replay of the last track.`}
      >
        <NumberInput
          min={1}
          max={0xffff}
          mt={0.75}
          {...form.getInputProps("replayOid")}
        />
      </FormField>

      <FormField
        label={i18n`Stop Code`}
        tooltip={i18n`OID code that will stop the current track.`}
      >
        <NumberInput
          min={1}
          max={0xffff}
          mt={0.75}
          {...form.getInputProps("stopOid")}
        />
      </FormField>

      <FormField label={i18n`Debug Mode`} tooltip={i18n`Enable debug mode.`}>
        <Checkbox mt={0.75} {...form.getInputProps("debug")} />
      </FormField>
    </>
  );
}
