import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Table,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { get, keys, set } from "idb-keyval";
import { useCallback, useState } from "react";
import { Download } from "../components/icons/Download";
import Trash from "../components/icons/Trash";
import { Upload } from "../components/icons/Upload";
import { Plus } from "../components/icons/Plus";
import { useI18n } from "../hooks/useI18n/useI18n";
import { iconStyle } from "../util/constants";
import { useAlert } from "./Alert";
import { useConfirm } from "./Confirm";
import {
  showSaveFilePicker,
  showOpenFilePicker,
} from "../util/fileSystemFallback";
import {
  useProjects,
  createProject,
  switchProject,
  deleteProject,
  updateProject,
} from "../hooks/useProjects";

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
  const { confirm, element: confirmHandle } = useConfirm();
  const i18n = useI18n();
  const { currentProjectId, projects, isLoading } = useProjects();
  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [newProjectName, setNewProjectName] = useState("");

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert(i18n`Please enter a project name`);
      return;
    }

    try {
      const project = await createProject(newProjectName.trim());
      await switchProject(project.id);
      closeCreate();
      setNewProjectName("");
    } catch (error) {
      alert(i18n`Failed to create project: ${(error as Error).message}`);
    }
  };

  const handleSwitchProject = async (projectId: string | null) => {
    if (!projectId) return;
    try {
      await switchProject(projectId);
    } catch (error) {
      alert(i18n`Failed to switch project: ${(error as Error).message}`);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const confirmed = await confirm(
      i18n`Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteProject(projectId);
      notifications.show({
        message: i18n`Project "${project.name}" deleted successfully`,
      });
    } catch (error) {
      alert(i18n`Failed to delete project: ${(error as Error).message}`);
    }
  };

  const saveProject = useCallback(async () => {
    if (!currentProject) return;

    const handle = await showSaveFilePicker({
      suggestedName: `${currentProject.name}.ndjson`,
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
      message: i18n`Exporting project...`,
    });

    const stream = await handle.createWritable();
    const writer = stream.getWriter();
    const projectPrefix = `${currentProjectId}:`;

    // Get all keys for current project
    const allKeys = (await keys()) as string[];
    const projectKeys = allKeys.filter(
      (k) =>
        k.startsWith(projectPrefix) ||
        k === `projects:${currentProjectId}` ||
        k === "currentProject",
    );

    for (const k of projectKeys) {
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
      "name" in handle ? handle.name : currentProject.name + ".ndjson";

    // Update project metadata with source filename
    await updateProject(currentProjectId!, { sourceFilename: handleName });

    notifications.show({
      message: i18n`Project exported to ${handleName}`,
    });
  }, [currentProject, currentProjectId, i18n]);

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

      // Extract project name from filename (remove .ndjson extension)
      const projectName = handleName.replace(/\.ndjson$/, "");

      notifications.show({
        loading: true,
        message: i18n`Loading ${handleName}...`,
      });

      const file = await fileHandle.getFile();
      const reader = file.stream().getReader();
      const decoder = new TextDecoder("utf-8");
      let { value, done } = await reader.read();
      let partialLine = "";

      // Create new project for the imported data
      const newProject = await createProject(projectName, handleName);
      const newProjectId = newProject.id;

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

            // Transform keys to use new project ID
            let newKey = key;
            if (typeof key === "string") {
              // Remove old project prefix and add new one
              if (key.includes(":")) {
                const parts = key.split(":");
                if (parts.length > 1 && parts[0].match(/^[0-9a-f-]{36}$/i)) {
                  // This is a project-scoped key
                  newKey = `${newProjectId}:${parts.slice(1).join(":")}`;
                } else {
                  // Old format without project prefix
                  newKey = `${newProjectId}:${key}`;
                }
              } else if (key === "options") {
                newKey = `${newProjectId}:options`;
              }
            }

            await set(newKey, data);
          }
        }

        ({ value, done } = await reader.read());
      }

      if (partialLine.trim()) {
        const [key, data] = JSON.parse(partialLine);
        let newKey = key;
        if (typeof key === "string") {
          if (key.includes(":")) {
            const parts = key.split(":");
            if (parts.length > 1 && parts[0].match(/^[0-9a-f-]{36}$/i)) {
              newKey = `${newProjectId}:${parts.slice(1).join(":")}`;
            } else {
              newKey = `${newProjectId}:${key}`;
            }
          } else if (key === "options") {
            newKey = `${newProjectId}:options`;
          }
        }

        if (typeof key === "string" && key.startsWith("data")) {
          const binaryString = atob(data);
          const uint8Array = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
          }
          await set(newKey, uint8Array);
        } else {
          await set(newKey, data);
        }
      }

      // Switch to the newly imported project
      await switchProject(newProjectId);
    } catch (error) {
      alert(i18n`Failed to open project: ${(error as Error).message}`);
    }
  }, [alert, i18n]);

  return (
    <>
      {alertHandle}
      {confirmHandle}
      <Stack gap="md">
        <div>
          <Title order={3}>{i18n`Projects`}</Title>
          <Text size="sm" c="dimmed">
            {i18n`Manage your Tiptoi projects`}
          </Text>
        </div>

        <Group gap="xs">
          <Select
            label={i18n`Current Project`}
            value={currentProjectId}
            onChange={handleSwitchProject}
            data={projects.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
            disabled={isLoading}
            style={{ flex: 1 }}
          />
          <Button
            onClick={openCreate}
            leftSection={<Plus {...iconStyle} />}
            style={{ marginTop: "auto" }}
          >
            {i18n`New`}
          </Button>
        </Group>

        <Group gap="xs">
          <Button
            leftSection={<Download {...iconStyle} />}
            onClick={saveProject}
            disabled={!currentProject}
          >
            {i18n`Export Project`}
          </Button>
          <Button leftSection={<Upload {...iconStyle} />} onClick={openProject}>
            {i18n`Import Project`}
          </Button>
        </Group>

        {currentProject && (
          <div>
            <Text size="sm" fw={500} mb="xs">
              {i18n`Current Project Details`}
            </Text>
            <Table>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={500}>{i18n`Name`}</Table.Td>
                  <Table.Td>{currentProject.name}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={500}>{i18n`Created`}</Table.Td>
                  <Table.Td>{currentProject.created.toLocaleString()}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={500}>{i18n`Modified`}</Table.Td>
                  <Table.Td>
                    {currentProject.modified.toLocaleString()}
                  </Table.Td>
                </Table.Tr>
                {currentProject.sourceFilename && (
                  <Table.Tr>
                    <Table.Td fw={500}>{i18n`Source File`}</Table.Td>
                    <Table.Td>{currentProject.sourceFilename}</Table.Td>
                  </Table.Tr>
                )}
                {currentProject.sourceUrl && (
                  <Table.Tr>
                    <Table.Td fw={500}>{i18n`Source URL`}</Table.Td>
                    <Table.Td>{currentProject.sourceUrl}</Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>
        )}

        <div>
          <Text size="sm" fw={500} mb="xs">
            {i18n`All Projects`}
          </Text>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{i18n`Name`}</Table.Th>
                <Table.Th>{i18n`Modified`}</Table.Th>
                <Table.Th>{i18n`Actions`}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {projects.map((project) => (
                <Table.Tr
                  key={project.id}
                  bg={project.id === currentProjectId ? "blue.0" : undefined}
                >
                  <Table.Td>{project.name}</Table.Td>
                  <Table.Td>{project.modified.toLocaleDateString()}</Table.Td>
                  <Table.Td>
                    <Tooltip label={i18n`Delete`}>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={projects.length === 1}
                      >
                        <Trash {...iconStyle} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </Stack>

      <Modal
        opened={createOpened}
        onClose={closeCreate}
        title={i18n`Create New Project`}
      >
        <Stack gap="md">
          <TextInput
            label={i18n`Project Name`}
            placeholder={i18n`My Tiptoi Book`}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateProject().catch(console.error);
              }
            }}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeCreate}>
              {i18n`Cancel`}
            </Button>
            <Button onClick={handleCreateProject}>{i18n`Create`}</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
