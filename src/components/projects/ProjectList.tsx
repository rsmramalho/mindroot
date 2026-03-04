// components/projects/ProjectList.tsx
// Grid of project cards with new project button

import type { ProjectWithChildren } from '@/hooks/useProject';
import ProjectCard from '@/components/projects/ProjectCard';
import EmptyState from '@/components/shared/EmptyState';
import { useItemMutations } from '@/hooks/useItemMutations';
import { useAppStore } from '@/store/app-store';

interface ProjectListProps {
  projects: ProjectWithChildren[];
  onSelect: (id: string) => void;
}

export default function ProjectList({ projects, onSelect }: ProjectListProps) {
  const { createItem } = useItemMutations();
  const user = useAppStore((s) => s.user);

  const handleCreateProject = async () => {
    if (!user) return;
    const item = await createItem.mutateAsync({
      user_id: user.id,
      title: 'Novo Projeto',
      type: 'project',
    });
    if (item?.id) {
      onSelect(item.id);
    }
  };

  if (projects.length === 0) {
    return (
      <EmptyState
        title="Nenhum projeto"
        description="Organize suas tarefas em projetos"
        actionLabel="+ Novo Projeto"
        onAction={handleCreateProject}
      />
    );
  }

  // Separate active vs completed
  const active = projects.filter((p) => !p.project.completed);
  const completed = projects.filter((p) => p.project.completed);

  return (
    <div className="flex flex-col gap-4">
      {/* Active projects */}
      {active.length > 0 && (
        <div className="flex flex-col gap-3">
          {active.map((p) => (
            <ProjectCard
              key={p.project.id}
              data={p}
              onClick={() => onSelect(p.project.id)}
            />
          ))}
        </div>
      )}

      {/* Completed projects */}
      {completed.length > 0 && (
        <div className="flex flex-col gap-2">
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              fontWeight: 600,
              color: '#8a9e7a60',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '8px 4px 0',
            }}
          >
            Concluidos
          </span>
          {completed.map((p) => (
            <ProjectCard
              key={p.project.id}
              data={p}
              onClick={() => onSelect(p.project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
