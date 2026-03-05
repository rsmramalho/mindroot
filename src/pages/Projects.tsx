// pages/Projects.tsx — Project list + detail views
import { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import ProjectList from '@/components/projects/ProjectList';
import ProjectSheet from '@/components/projects/ProjectSheet';
import { ListSkeleton } from '@/components/shared/Skeleton';

export function ProjectsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { projectsWithChildren, currentProject, projectTasks, projectNotes, isLoading } =
    useProject(selectedProjectId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-1">
        <div className="flex items-center justify-between px-1 pb-2">
          <h2 className="font-serif text-xl font-light text-light tracking-tight">
            Projetos
          </h2>
        </div>
        <ListSkeleton count={3} type="project" />
      </div>
    );
  }

  // Detail view
  if (selectedProjectId && currentProject) {
    return (
      <ProjectSheet
        data={currentProject}
        tasks={projectTasks}
        notes={projectNotes}
        onBack={() => setSelectedProjectId(null)}
      />
    );
  }

  // List view
  return (
    <div className="flex flex-col gap-2 px-1">
      <div className="flex items-center justify-between px-1 pb-2">
        <h2 className="font-serif text-xl font-light text-light tracking-tight">
          Projetos
        </h2>
        <span className="font-mono text-xs text-muted/40">
          {projectsWithChildren.length}
        </span>
      </div>

      <ProjectList
        projects={projectsWithChildren}
        onSelect={setSelectedProjectId}
      />
    </div>
  );
}
