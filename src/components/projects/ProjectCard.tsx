// components/projects/ProjectCard.tsx
// Card visual de um projeto com progresso e módulo

import type { ProjectWithChildren } from '@/hooks/useProject';
import ModuleBadge from '@/components/shared/ModuleBadge';

interface ProjectCardProps {
  data: ProjectWithChildren;
  onClick: () => void;
}

export default function ProjectCard({ data, onClick }: ProjectCardProps) {
  const { project, totalTasks, completedTasks, progress } = data;

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-200 hover:brightness-110"
      style={{
        backgroundColor: '#1a1d24',
        borderRadius: '12px',
        border: '1px solid #a8947812',
        padding: '16px',
      }}
    >
      {/* Header: title + module */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '18px',
            fontWeight: 400,
            color: '#e8e0d4',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          {project.title}
        </h3>
        <ModuleBadge module={project.module} size="sm" showLabel={false} />
      </div>

      {/* Description preview */}
      {project.description && (
        <p
          className="truncate mb-3"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#a8947860',
            fontWeight: 400,
          }}
        >
          {project.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div
          className="flex-1 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso: ${completedTasks} de ${totalTasks} tarefas`}
          style={{ height: 3, backgroundColor: '#a8947815' }}
        >
          <div
            className="rounded-full transition-all duration-500"
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor:
                progress === 100
                  ? '#8a9e7a'
                  : progress > 50
                    ? '#c4a882'
                    : '#a89478',
            }}
          />
        </div>

        {/* Stats */}
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
            color: '#a8947860',
            flexShrink: 0,
          }}
        >
          {completedTasks}/{totalTasks}
        </span>
      </div>

      {/* Priority indicator */}
      {project.priority && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className="inline-block rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor:
                project.priority === 'urgente'
                  ? '#e85d5d'
                  : project.priority === 'importante'
                    ? '#e8a84c'
                    : '#6b7280',
            }}
          />
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              color: '#a8947850',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {project.priority}
          </span>
        </div>
      )}
    </button>
  );
}
