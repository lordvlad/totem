import { useEffect } from "react";
import { keys, get } from "idb-keyval";
import { useCurrentProject } from "./useCurrentProject";
import { useProjects } from "./useProjects";

export function useProjectInitialization() {
  const { currentProjectUuid, isInitialized } = useCurrentProject();
  const { projects, createProject } = useProjects();

  useEffect(() => {
    if (!isInitialized) return;

    // Auto-create a default project if none exists and we have no current project
    // eslint-disable-next-line complexity -- This initialization logic requires checking multiple conditions
    const initializeDefaultProject = async () => {
      if (currentProjectUuid != null || projects.length > 0) {
        return;
      }

      // Check if there's legacy data (non-namespaced)
      const allKeys = await keys();
      const hasLegacyData = allKeys.some(
        (k) =>
          typeof k === "string" &&
          (k.startsWith("track:") || k.startsWith("data:") || k === "options"),
      );

      if (!hasLegacyData) {
        return;
      }

      // Create a project for the legacy data
      const optionsData = (await get("options")) as unknown;
      let projectName = "My Project";

      if (
        optionsData != null &&
        typeof optionsData === "object" &&
        "projectName" in optionsData &&
        typeof optionsData.projectName === "string"
      ) {
        projectName = optionsData.projectName;
      }

      await createProject(projectName);
      // Note: The legacy data will remain with legacy keys and be accessible
      // since we use legacy keys when currentProjectUuid is null
    };

    void initializeDefaultProject();
  }, [isInitialized, currentProjectUuid, projects.length, createProject]);
}
