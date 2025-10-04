import { get, set } from "idb-keyval";
import { proxy, subscribe, useSnapshot } from "valtio";
import type { ProjectMetadata } from "../types/project";

interface CurrentProjectState {
  currentProjectUuid: string | null;
  isInitialized: boolean;
}

const initialState: CurrentProjectState = {
  currentProjectUuid: null,
  isInitialized: false,
};

export const currentProjectProxy = proxy<CurrentProjectState>(initialState);

// Load current project UUID from storage
get("currentProject").then((uuid) => {
  if (uuid && typeof uuid === "string") {
    currentProjectProxy.currentProjectUuid = uuid;
  }
  currentProjectProxy.isInitialized = true;
});

// Subscribe to changes and persist
subscribe(currentProjectProxy, () => {
  if (currentProjectProxy.isInitialized) {
    if (currentProjectProxy.currentProjectUuid) {
      set("currentProject", currentProjectProxy.currentProjectUuid);
    }
  }
});

export function setCurrentProject(uuid: string | null) {
  currentProjectProxy.currentProjectUuid = uuid;
}

export function useCurrentProject() {
  const state = useSnapshot(currentProjectProxy);
  return {
    currentProjectUuid: state.currentProjectUuid,
    isInitialized: state.isInitialized,
    setCurrentProject,
  };
}

export function getCurrentProjectUuid(): string | null {
  return currentProjectProxy.currentProjectUuid;
}

// Helper to get project-namespaced key
export function getProjectKey(
  key: string,
  projectUuid?: string | null,
): string {
  const uuid = projectUuid ?? getCurrentProjectUuid();
  if (!uuid) {
    // Fallback for backward compatibility - use legacy keys
    return key;
  }
  return `project:${uuid}:${key}`;
}
