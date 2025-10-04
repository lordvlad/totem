import { get, keys, set, del, clear } from "idb-keyval";
import { useState, useEffect, useCallback } from "react";
import type { ProjectMetadata } from "../types/project";
import {
  setCurrentProject as setCurrentProjectUuid,
  useCurrentProject,
} from "./useCurrentProject";

const PROJECTS_LIST_KEY = "projects:list";

export function useProjects() {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentProjectUuid, isInitialized } = useCurrentProject();

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const projectsList =
        (await get<ProjectMetadata[]>(PROJECTS_LIST_KEY)) ?? [];
      setProjects(projectsList);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      void loadProjects();
    }
  }, [isInitialized, loadProjects]);

  const saveProjectsList = useCallback(
    async (projectsList: ProjectMetadata[]) => {
      await set(PROJECTS_LIST_KEY, projectsList);
      setProjects(projectsList);
    },
    [],
  );

  const createProject = useCallback(
    async (name: string, sourceFilename?: string, sourceUrl?: string) => {
      const uuid = crypto.randomUUID();
      const now = new Date().toISOString();
      const newProject: ProjectMetadata = {
        uuid,
        name,
        createdAt: now,
        updatedAt: now,
        sourceFilename,
        sourceUrl,
      };

      const updatedProjects = [...projects, newProject];
      await saveProjectsList(updatedProjects);
      return newProject;
    },
    [projects, saveProjectsList],
  );

  const updateProject = useCallback(
    async (
      uuid: string,
      updates: Partial<Omit<ProjectMetadata, "uuid" | "createdAt">>,
    ) => {
      const updatedProjects = projects.map((p) =>
        p.uuid === uuid
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p,
      );
      await saveProjectsList(updatedProjects);
    },
    [projects, saveProjectsList],
  );

  const deleteProject = useCallback(
    async (uuid: string) => {
      // Remove project from list
      const updatedProjects = projects.filter((p) => p.uuid !== uuid);
      await saveProjectsList(updatedProjects);

      // Delete all project data
      const allKeys = await keys();
      const projectKeys = allKeys.filter(
        (k) => typeof k === "string" && k.startsWith(`project:${uuid}:`),
      );

      if (projectKeys.length > 0) {
        await Promise.all(projectKeys.map(async (k) => await del(k)));
      }

      // If we deleted the current project, clear current project
      if (currentProjectUuid === uuid) {
        setCurrentProjectUuid(null);
      }
    },
    [projects, saveProjectsList, currentProjectUuid],
  );

  const switchToProject = useCallback((uuid: string | null) => {
    setCurrentProjectUuid(uuid);
    // Reload to refresh all project-specific data
    window.location.reload();
  }, []);

  const clearAllProjects = useCallback(async () => {
    await clear();
    setProjects([]);
    setCurrentProjectUuid(null);
  }, []);

  return {
    projects,
    currentProjectUuid,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    switchToProject,
    clearAllProjects,
    loadProjects,
  };
}
