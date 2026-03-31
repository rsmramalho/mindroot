// hooks/useProject.ts — Project-level derived data
// Projects are AtomItems with type='project'.
// Children reference project_id to link tasks -> project.

import { useMemo } from 'react';
import { useItems } from '@/hooks/useItems';
import type { AtomItem } from '@/types/item';

export interface ProjectWithChildren {
  project: AtomItem;
  children: AtomItem[];
  totalTasks: number;
  completedTasks: number;
  progress: number; // 0-100
}

export function useProject(projectId?: string | null) {
  const { items, isLoading } = useItems();

  // All projects
  const projects = useMemo(
    () => items.filter((i) => i.type === 'project' && i.status !== 'archived'),
    [items]
  );

  // Projects with their children and stats
  const projectsWithChildren = useMemo(() => {
    return projects.map((project): ProjectWithChildren => {
      const children = items.filter(
        (i) => i.project_id === project.id && i.status !== 'archived'
      );
      const totalTasks = children.filter(
        (c) => c.type === 'task' || c.tags.includes('chore') || c.type === 'habit'
      ).length;
      const completedTasks = children.filter(
        (c) =>
          c.status === 'completed' &&
          (c.type === 'task' || c.tags.includes('chore') || c.type === 'habit')
      ).length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return { project, children, totalTasks, completedTasks, progress };
    });
  }, [projects, items]);

  // Single project detail
  const currentProject = useMemo(() => {
    if (!projectId) return null;
    return projectsWithChildren.find((p) => p.project.id === projectId) ?? null;
  }, [projectId, projectsWithChildren]);

  // Children for current project, categorized
  const projectTasks = useMemo(() => {
    if (!currentProject) return [];
    return currentProject.children.filter(
      (c) => c.type === 'task' || c.tags.includes('chore') || c.type === 'habit'
    );
  }, [currentProject]);

  const projectNotes = useMemo(() => {
    if (!currentProject) return [];
    return currentProject.children.filter(
      (c) => c.type === 'note' || c.type === 'reflection' || c.type === 'log'
    );
  }, [currentProject]);

  return {
    projects,
    projectsWithChildren,
    currentProject,
    projectTasks,
    projectNotes,
    isLoading,
  };
}
