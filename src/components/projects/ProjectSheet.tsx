// components/projects/ProjectSheet.tsx
// Detail view for a single project — 4 panes:
// Visão Geral | Tarefas | Notas | Linha do Tempo

import { useState, useMemo } from 'react';
import type { ProjectWithChildren } from '@/hooks/useProject';
import type { AtomItem, UpdateItemPayload, Priority } from '@/types/item';
import { useItemMutations } from '@/hooks/useItemMutations';
import { useAppStore } from '@/store/app-store';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ItemRow from '@/components/shared/ItemRow';
import ModuleBadge from '@/components/shared/ModuleBadge';
import EmptyState from '@/components/shared/EmptyState';
import EditSheet from '@/components/shared/EditSheet';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const PRIORITY_DISPLAY: Record<string, { label: string; color: string }> = {
  high: { label: 'Alta', color: '#d4856a' },
  medium: { label: 'Média', color: '#c4a882' },
  low: { label: 'Baixa', color: '#8a9e7a' },
};

type Pane = 'overview' | 'tasks' | 'notes' | 'timeline';

interface ProjectSheetProps {
  data: ProjectWithChildren;
  tasks: AtomItem[];
  notes: AtomItem[];
  onBack: () => void;
}

const PANES: { key: Pane; label: string }[] = [
  { key: 'overview', label: 'Geral' },
  { key: 'tasks', label: 'Tarefas' },
  { key: 'notes', label: 'Notas' },
  { key: 'timeline', label: 'Linha' },
];

export default function ProjectSheet({ data, tasks, notes, onBack }: ProjectSheetProps) {
  const [activePane, setActivePane] = useState<Pane>('overview');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [editingItem, setEditingItem] = useState<AtomItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { project, totalTasks, completedTasks, progress } = data;
  const { createItem, completeMutation, uncompleteMutation, deleteMutation, updateMutation } =
    useItemMutations();
  const user = useAppStore((s) => s.user);

  const handleComplete = (id: string) => completeMutation.mutate(id);
  const handleUncomplete = (id: string) => uncompleteMutation.mutate(id);
  const handleDelete = (id: string) => setDeletingId(id);
  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
      setDeletingId(null);
    }
  };
  const handleArchive = (id: string) => {
    updateMutation.mutate({ id, updates: { status: 'archived' as const } });
  };
  const handleEdit = (id: string, updates: Partial<AtomItem>) => {
    updateMutation.mutate({ id, updates });
  };
  const handleOpenSheet = (item: AtomItem) => setEditingItem(item);
  const handleSheetSave = (id: string, updates: UpdateItemPayload) => {
    updateMutation.mutate({ id, updates });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !user) return;
    createItem.mutate({
      user_id: user.id,
      title: newTaskTitle.trim(),
      type: 'task',
      project_id: project.id,
      module: project.module,
    });
    setNewTaskTitle('');
  };

  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !user) return;
    createItem.mutate({
      user_id: user.id,
      title: newNoteTitle.trim(),
      type: 'note',
      project_id: project.id,
      module: project.module,
    });
    setNewNoteTitle('');
  };

  // Timeline: all children sorted by date
  const timeline = useMemo(() => {
    return [...data.children]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data.children]);

  // Pending and done tasks
  const pendingTasks = useMemo(() => tasks.filter((t) => t.status !== 'completed'), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((t) => t.status === 'completed'), [tasks]);

  const projectPriority = project.body.operations?.priority;
  const projectNotes = project.notes;

  return (
    <div className="flex flex-col gap-0" style={{ paddingBottom: '80px' }}>
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onBack}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#a8947860',
            padding: '4px 0',
          }}
        >
          ← Projetos
        </button>
      </div>

      <div className="flex items-start justify-between gap-3 mb-1">
        <h2
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '24px',
            fontWeight: 400,
            color: '#e8e0d4',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          {project.title}
        </h2>
        <ModuleBadge module={project.module} size="md" />
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex-1 rounded-full overflow-hidden"
          style={{ height: 4, backgroundColor: '#a8947815' }}
        >
          <div
            className="rounded-full transition-all duration-500"
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: progress === 100 ? '#8a9e7a' : '#c4a882',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '12px',
            color: '#a8947860',
          }}
        >
          {completedTasks}/{totalTasks}
        </span>
      </div>

      {/* Pane Tabs */}
      <div
        className="flex items-center gap-0 mb-4"
        style={{
          borderBottom: '1px solid #a8947815',
        }}
      >
        {PANES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActivePane(key)}
            className="transition-all duration-150"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontWeight: activePane === key ? 600 : 400,
              color: activePane === key ? '#c4a882' : '#a8947850',
              padding: '8px 14px',
              borderBottom: activePane === key ? '2px solid #c4a882' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ━━━ Pane: Overview ━━━ */}
      {activePane === 'overview' && (
        <div className="flex flex-col gap-4">
          {projectNotes && (
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#e8e0d4cc',
                lineHeight: 1.6,
              }}
            >
              {projectNotes}
            </p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatBlock label="Tarefas" value={String(totalTasks)} />
            <StatBlock label="Concluídas" value={String(completedTasks)} />
            <StatBlock label="Notas" value={String(notes.length)} />
            <StatBlock
              label="Criado em"
              value={format(parseISO(project.created_at), 'd MMM', { locale: ptBR })}
            />
          </div>

          {/* Priority */}
          {projectPriority && (
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  color: '#a8947850',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                }}
              >
                Prioridade
              </span>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: PRIORITY_DISPLAY[projectPriority]?.color || '#a89478',
                  fontWeight: 500,
                }}
              >
                {PRIORITY_DISPLAY[projectPriority]?.label || projectPriority}
              </span>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded"
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontFamily: '"JetBrains Mono", monospace',
                    color: '#a89478',
                    backgroundColor: '#a8947815',
                    border: '1px solid #a8947825',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ━━━ Pane: Tasks ━━━ */}
      {activePane === 'tasks' && (
        <div className="flex flex-col gap-3">
          {/* Quick add */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="Nova tarefa..."
              className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm font-sans text-light placeholder:text-muted/30 focus:outline-none focus:border-mind/40"
            />
            {newTaskTitle.trim() && (
              <button
                onClick={handleAddTask}
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '14px',
                  color: '#c4a882',
                  padding: '8px 12px',
                }}
              >
                +
              </button>
            )}
          </div>

          {/* Pending */}
          {pendingTasks.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {pendingTasks.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onComplete={handleComplete}
                  onUncomplete={handleUncomplete}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onOpenSheet={handleOpenSheet}
                />
              ))}
            </div>
          )}

          {/* Done */}
          {doneTasks.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#8a9e7a60',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '8px 4px 2px',
                }}
              >
                Concluídas
              </span>
              {doneTasks.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onComplete={handleComplete}
                  onUncomplete={handleUncomplete}
                  onDelete={handleDelete}
                  compact
                />
              ))}
            </div>
          )}

          {pendingTasks.length === 0 && doneTasks.length === 0 && (
            <EmptyState title="Sem tarefas" description="Adicione a primeira tarefa acima" />
          )}
        </div>
      )}

      {/* ━━━ Pane: Notes ━━━ */}
      {activePane === 'notes' && (
        <div className="flex flex-col gap-3">
          {/* Quick add note */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              placeholder="Nova nota..."
              className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm font-sans text-light placeholder:text-muted/30 focus:outline-none focus:border-mind/40"
            />
            {newNoteTitle.trim() && (
              <button
                onClick={handleAddNote}
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '14px',
                  color: '#c4a882',
                  padding: '8px 12px',
                }}
              >
                +
              </button>
            )}
          </div>

          {notes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg"
                  style={{
                    backgroundColor: '#1a1d24',
                    border: '1px solid #a8947810',
                    padding: '12px 14px',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                        color: '#e8e0d4cc',
                        fontWeight: 400,
                      }}
                    >
                      {note.title}
                    </span>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '10px',
                        color: '#a8947840',
                        flexShrink: 0,
                      }}
                    >
                      {format(parseISO(note.created_at), 'd MMM', { locale: ptBR })}
                    </span>
                  </div>
                  {note.body.soul?.emotion_before && (
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        color: '#a8947860',
                        display: 'block',
                        marginTop: '6px',
                      }}
                    >
                      sentindo {note.body.soul.emotion_before}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sem notas" description="Registre reflexões sobre o projeto" />
          )}
        </div>
      )}

      {/* ━━━ Pane: Timeline ━━━ */}
      {activePane === 'timeline' && (
        <div className="flex flex-col gap-0">
          {timeline.length > 0 ? (
            timeline.map((item, i) => (
              <div key={item.id} className="flex gap-3" style={{ padding: '8px 0' }}>
                {/* Timeline line */}
                <div className="flex flex-col items-center" style={{ width: 20 }}>
                  <span
                    className="rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: item.status === 'completed' ? '#8a9e7a' : '#a8947840',
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                  {i < timeline.length - 1 && (
                    <div
                      className="flex-1"
                      style={{
                        width: 1,
                        backgroundColor: '#a8947815',
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-2">
                  <span
                    className="block truncate"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      color: item.status === 'completed' ? '#a8947860' : '#e8e0d4cc',
                      fontWeight: 400,
                      textDecoration: item.status === 'completed' ? 'line-through' : 'none',
                    }}
                  >
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '10px',
                        color: '#a8947840',
                      }}
                    >
                      {format(parseISO(item.created_at), "d MMM ''yy", { locale: ptBR })}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '10px',
                        color: '#a8947830',
                      }}
                    >
                      {item.type}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="Linha do tempo vazia" description="Atividades aparecerão aqui" />
          )}
        </div>
      )}

      {/* Edit Sheet */}
      <EditSheet
        item={editingItem}
        onSave={handleSheetSave}
        onClose={() => setEditingItem(null)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletingId}
        title="Excluir item"
        description="Este item será removido permanentemente."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmColor="#e85d5d"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: '#1a1d24',
        border: '1px solid #a8947810',
        padding: '12px 14px',
      }}
    >
      <span
        className="block"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '18px',
          color: '#e8e0d4',
          fontWeight: 400,
        }}
      >
        {value}
      </span>
      <span
        className="block mt-1"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          color: '#a8947850',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
    </div>
  );
}
