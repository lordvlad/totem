import { get, set, keys, del, delMany } from "idb-keyval";
import { proxy, useSnapshot } from "valtio";

export interface ProjectMetadata {
  id: string;
  name: string;
  created: Date;
  modified: Date;
  sourceFilename?: string;
  sourceUrl?: string;
}

const CURRENT_PROJECT_KEY = "currentProject";
const PROJECT_PREFIX = "projects:";

// State
const projectsProxy = proxy<{
  currentProjectId: string | null;
  projects: ProjectMetadata[];
  isLoading: boolean;
}>({
  currentProjectId: null,
  projects: [],
  isLoading: false,
});

// Initialize - load current project and list
// eslint-disable-next-line complexity -- Need to handle migration scenarios
async function initProjects() {
  projectsProxy.isLoading = true;

  try {
    // Load current project
    const currentId = await get<string | undefined>(CURRENT_PROJECT_KEY);

    // Check if old format exists (migration needed)
    const allKeys = await keys();
    const hasOldFormat = allKeys.some((k) => {
      if (typeof k !== "string") return false;
      return k === "options" || k.startsWith("track:") || k.startsWith("data:");
    });

    if (currentId === undefined && !hasOldFormat) {
      // No projects exist - create default
      const defaultProject = await createProject("My Tiptoi Book");
      projectsProxy.currentProjectId = defaultProject.id;
    } else if (currentId === undefined && hasOldFormat) {
      // Old format exists - migrate
      const migratedProject = await migrateOldData();
      projectsProxy.currentProjectId = migratedProject.id;
    } else if (currentId !== undefined) {
      projectsProxy.currentProjectId = currentId;
    }

    // Load all projects
    await loadProjectList();
  } finally {
    projectsProxy.isLoading = false;
  }
}

// Load project list
async function loadProjectList() {
  const allKeys = await keys();
  const projectKeys = allKeys.filter((k) => {
    if (typeof k !== "string") return false;
    return k.startsWith(PROJECT_PREFIX);
  });

  const projectList = await Promise.all(
    projectKeys.map(async (k) => {
      const data = await get<ProjectMetadata | undefined>(k);
      // Convert date strings back to Date objects
      if (data !== undefined) {
        return {
          ...data,
          created: new Date(data.created),
          modified: new Date(data.modified),
        };
      }
      return null;
    }),
  );

  projectsProxy.projects = projectList.filter(
    (p): p is ProjectMetadata => p !== null,
  );
}

// Migrate old single-project data to new format
// eslint-disable-next-line complexity -- Migration has multiple conditions to handle
async function migrateOldData(): Promise<ProjectMetadata> {
  const allKeys = await keys();

  // Create default project
  const project: ProjectMetadata = {
    id: crypto.randomUUID(),
    name: "My First Project",
    created: new Date(),
    modified: new Date(),
  };

  // Save project metadata
  await set(`${PROJECT_PREFIX}${project.id}`, project);
  await set(CURRENT_PROJECT_KEY, project.id);

  // Migrate keys
  for (const key of allKeys) {
    if (typeof key !== "string") continue;

    if (
      key === "options" ||
      key.startsWith("track:") ||
      key.startsWith("data:")
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Migration handles any stored value type
      const value = await get(key);
      const newKey = `${project.id}:${key}`;
      await set(newKey, value);
      await del(key);
    }
  }

  return project;
}

// Create new project
export async function createProject(
  name: string,
  sourceFilename?: string,
  sourceUrl?: string,
): Promise<ProjectMetadata> {
  const project: ProjectMetadata = {
    id: crypto.randomUUID(),
    name,
    created: new Date(),
    modified: new Date(),
    sourceFilename,
    sourceUrl,
  };

  await set(`${PROJECT_PREFIX}${project.id}`, project);
  projectsProxy.projects.push(project);

  return project;
}

// Update project metadata
export async function updateProject(
  projectId: string,
  updates: Partial<ProjectMetadata>,
): Promise<void> {
  const project = projectsProxy.projects.find((p) => p.id === projectId);
  if (project === undefined) {
    throw new Error("Project not found");
  }

  const updatedProject = {
    ...project,
    ...updates,
    modified: new Date(),
  };

  await set(`${PROJECT_PREFIX}${projectId}`, updatedProject);

  // Update in state
  const index = projectsProxy.projects.findIndex((p) => p.id === projectId);
  if (index !== -1) {
    projectsProxy.projects[index] = updatedProject;
  }
}

// Switch to different project
export async function switchProject(projectId: string): Promise<void> {
  await set(CURRENT_PROJECT_KEY, projectId);
  projectsProxy.currentProjectId = projectId;

  // Reload page to reset state
  window.location.reload();
}

// Delete project
// eslint-disable-next-line complexity -- Need to handle project switching logic
export async function deleteProject(projectId: string): Promise<void> {
  const allKeys = await keys();
  const projectPrefix = `${projectId}:`;
  const keysToDelete: string[] = [];

  for (const k of allKeys) {
    if (typeof k === "string" && k.startsWith(projectPrefix)) {
      keysToDelete.push(k);
    }
  }

  // Delete all project data
  await delMany([...keysToDelete, `${PROJECT_PREFIX}${projectId}`]);

  // Remove from list
  projectsProxy.projects = projectsProxy.projects.filter(
    (p) => p.id !== projectId,
  );

  // If deleting current project, switch to another or create new
  if (projectId === projectsProxy.currentProjectId) {
    if (projectsProxy.projects.length > 0) {
      await switchProject(projectsProxy.projects[0].id);
    } else {
      const newProject = await createProject("My Tiptoi Book");
      await switchProject(newProject.id);
    }
  }
}

// Get current project ID (used for prefixing keys)
export function getCurrentProjectId(): string {
  const id = projectsProxy.currentProjectId;
  if (id === null) {
    throw new Error("No current project");
  }
  return id;
}

// Helper to create project-scoped key
export function getProjectKey(key: string): string {
  return `${getCurrentProjectId()}:${key}`;
}

// Hook
export function useProjects() {
  const state = useSnapshot(projectsProxy);
  return {
    ...state,
    createProject,
    updateProject,
    switchProject,
    deleteProject,
    loadProjectList,
  };
}

// Initialize on import
initProjects().catch(console.error);
