import {
  Button,
  Group,
  Modal,
  Table,
  Text,
  TextInput,
  Badge,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { get, keys, set } from "idb-keyval";
import { useCallback, useState } from "react";
import { FormField } from "../components/FormField";
import { Download } from "../components/icons/Download";
import Globe from "../components/icons/Globe";
import Trash from "../components/icons/Trash";
import { Upload } from "../components/icons/Upload";
import { useI18n } from "../hooks/useI18n/useI18n";
import { useOptions } from "../hooks/useOptions";
import { useProjects } from "../hooks/useProjects";
import { iconStyle } from "../util/constants";
import { useAlert } from "./Alert";
import { useConfirm } from "./Confirm";
import {
  showSaveFilePicker,
  showOpenFilePicker,
} from "../util/fileSystemFallback";

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

export function ProjectsPanel() {
  const { alert, element: alertHandle } = useAlert();
  const i18n = useI18n();
  const [options] = useOptions();
  const {
    projects,
    currentProjectUuid,
    deleteProject: deleteProjectHook,
    switchToProject,
    clearAllProjects,
  } = useProjects();
  const [projectUrl, setProjectUrl] = useState("");
  const [urlModalOpened, { open: openUrlModal, close: closeUrlModal }] =
    useDisclosure(false);
  const { confirm, element: confirmHandle } = useConfirm();

  const saveProject = useCallback(async () => {
    const handle = await showSaveFilePicker({
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

    const handleName =
      "name" in handle ? handle.name : options.projectName + ".ndjson";
    notifications.show({ message: i18n`Project downloaded to ${handleName}` });
  }, [options, i18n]);

  const openProject = useCallback(async () => {
    try {
      const [fileHandle] = await showOpenFilePicker({
        types: [
          {
            description: "Json Lines",
            accept: {
              "application/jsonlines": [".ndjson"],
            },
          },
        ],
      });

      const handleName =
        "name" in fileHandle ? fileHandle.name : "project.ndjson";
      notifications.show({
        loading: true,
        message: i18n`Loading ${handleName}`,
      });

      const file = await fileHandle.getFile();
      const reader = file.stream().getReader();
      const decoder = new TextDecoder("utf-8");
      let { value, done } = await reader.read();
      let partialLine = "";

      while (!done) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = (partialLine + chunk).split("\n");
        partialLine = lines.pop() ?? "";

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

  const loadProjectFromUrl = useCallback(async () => {
    if (!projectUrl.trim()) {
      alert(i18n`Failed to open project: Please enter a valid URL`);
      return;
    }

    closeUrlModal();

    try {
      notifications.show({
        loading: true,
        message: i18n`Loading project from URL...`,
        id: "load-url",
      });

      const response = await fetch(projectUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const lines = text.split("\n");

      for (const line of lines) {
        if (line.trim()) {
          const [key, data] = JSON.parse(line, (_k: string, value: unknown) => {
            if (typeof value === "string") {
              if (value.startsWith("uint8array:base64:"))
                return fromBase64(value.substring("uint8array:base64:".length));
              if (value.startsWith("arraybuffer:base64:"))
                return fromBase64(value.substring("arraybuffer:base64:".length))
                  .buffer;
            }
            return value;
          });
          await set(key, data);
        }
      }

      notifications.hide("load-url");
      window.location.reload();
    } catch (error) {
      notifications.hide("load-url");
      alert(i18n`Failed to open project: ${(error as Error).message}`);
    }
  }, [projectUrl, alert, i18n, closeUrlModal]);

  const deleteProject = useCallback(
    (uuid: string) => {
      confirm(i18n`Are you sure you want to delete this project?`).then(
        (confirmed) => {
          if (!confirmed) return;
          return deleteProjectHook(uuid);
        },
      );
    },
    [confirm, deleteProjectHook, i18n],
  );

  const deleteAllProjects = useCallback(() => {
    confirm(
      i18n`Are you sure you want to delete ALL projects? This cannot be undone.`,
    ).then((confirmed) => {
      if (!confirmed) return;
      return clearAllProjects().then(() => {
        localStorage.removeItem("options");
        window.location.reload();
      });
    });
  }, [confirm, clearAllProjects, i18n]);

  return (
    <>
      {alertHandle}
      {confirmHandle}

      <FormField label={i18n`Project Actions`}>
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
          <Button leftSection={<Globe {...iconStyle} />} onClick={openUrlModal}>
            {i18n`Load from URL`}
          </Button>
          <Button color="red" onClick={deleteAllProjects}>
            {i18n`Delete All Projects`}
          </Button>
        </Group>
      </FormField>

      <Modal
        opened={urlModalOpened}
        onClose={closeUrlModal}
        title={i18n`Load from URL`}
        size="lg"
      >
        <FormField
          label={i18n`Project URL`}
          tooltip={i18n`Enter a public URL to a .ndjson project file`}
        >
          <TextInput
            placeholder="https://example.com/project.ndjson"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && projectUrl.trim()) {
                loadProjectFromUrl();
              }
            }}
            data-autofocus
          />
        </FormField>
        <Group mt="md" gap={4} style={{ justifyContent: "flex-end" }}>
          <Button variant="subtle" onClick={closeUrlModal}>
            {i18n`Close`}
          </Button>
          <Button
            onClick={loadProjectFromUrl}
            disabled={!projectUrl.trim()}
            leftSection={<Globe {...iconStyle} />}
          >
            {i18n`Load from URL`}
          </Button>
        </Group>
      </Modal>

      <FormField label={i18n`Stored Projects`}>
        {projects.length === 0 ? (
          <Text c="dimmed" size="sm">
            {i18n`No projects stored yet`}
          </Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{i18n`Name`}</Table.Th>
                <Table.Th>{i18n`Created`}</Table.Th>
                <Table.Th>{i18n`Source`}</Table.Th>
                <Table.Th>{i18n`Actions`}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {projects.map((project) => (
                <Table.Tr key={project.uuid}>
                  <Table.Td>
                    <Group gap="xs">
                      {project.name}
                      {project.uuid === currentProjectUuid && (
                        <Badge size="sm" color="blue">
                          {i18n`Active`}
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {project.sourceFilename && (
                      <Text size="sm" c="dimmed">
                        {project.sourceFilename}
                      </Text>
                    )}
                    {project.sourceUrl && (
                      <Text size="sm" c="dimmed">
                        {project.sourceUrl}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {project.uuid !== currentProjectUuid && (
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => switchToProject(project.uuid)}
                        >
                          {i18n`Switch to`}
                        </Button>
                      )}
                      <Tooltip label={i18n`Delete project`}>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => deleteProject(project.uuid)}
                        >
                          <Trash {...iconStyle} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </FormField>
    </>
  );
}
