// components/shared/ItemRow.tsx
// Item row com ações: complete, edit inline, archive, delete
// alpha.8: "..." button abre EditSheet, inline edit melhorado

import { useState, useRef, memo } from 'react';
import { format, isToday, isPast, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ModuleBadge from './ModuleBadge';
import PriorityDot from './PriorityDot';
import TagChip from './TagChip';
import type { AtomItem } from '@/types/item';
import { getRecurrenceBadge } from '@/engine/recurrence';

interface ItemRowProps {
  item: AtomItem;
  onComplete?: (id: string) => void;
  onUncomplete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, updates: Partial<AtomItem>) => void;
  onOpenSheet?: (item: AtomItem) => void;
  showActions?: boolean;
  compact?: boolean;
}

function ItemRow({
  item,
  onComplete,
  onUncomplete,
  onArchive,
  onDelete,
  onEdit,
  onOpenSheet,
  showActions = true,
  compact = false,
}: ItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCompleted = item.completed;
  const isOverdue =
    !isCompleted && item.due_date && isPast(startOfDay(new Date(item.due_date))) && !isToday(new Date(item.due_date));
  const isDueToday = item.due_date && isToday(new Date(item.due_date));

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) {
      onUncomplete?.(item.id);
    } else {
      onComplete?.(item.id);
    }
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setEditTitle(item.title);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSaveEdit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== item.title) {
      onEdit?.(item.id, { title: trimmed });
    }
    setEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') {
      setEditTitle(item.title);
      setEditing(false);
    }
  };

  const handleOpenSheet = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenSheet?.(item);
  };

  const formatDueDate = () => {
    if (!item.due_date) return null;
    const date = new Date(item.due_date);
    if (isToday(date)) return 'Hoje';
    return format(date, "d MMM", { locale: ptBR });
  };

  return (
    <div
      className="group transition-all duration-150"
      style={{
        backgroundColor: expanded ? '#1a1d2480' : 'transparent',
        borderRadius: '8px',
      }}
    >
      {/* Main Row */}
      <div
        className="flex items-center gap-3 cursor-pointer select-none"
        style={{ padding: compact ? '8px 4px' : '10px 8px' }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          aria-label={isCompleted ? `Desmarcar: ${item.title}` : `Completar: ${item.title}`}
          role="checkbox"
          aria-checked={isCompleted}
          className="flex-shrink-0 flex items-center justify-center rounded-full border transition-all duration-200"
          style={{
            width: 20,
            height: 20,
            borderColor: isCompleted ? '#8a9e7a' : isOverdue ? '#e85d5d60' : '#a8947840',
            backgroundColor: isCompleted ? '#8a9e7a20' : 'transparent',
            color: isCompleted ? '#8a9e7a' : 'transparent',
            fontSize: '11px',
          }}
        >
          {isCompleted && '✓'}
        </button>

        {/* Priority dot */}
        {!isCompleted && <PriorityDot priority={item.priority} />}

        {/* Title / Edit */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full bg-transparent outline-none"
              style={{
                color: '#e8e0d4',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                borderBottom: '1px solid #c4a88260',
                paddingBottom: '2px',
              }}
            />
          ) : (
            <span
              style={{
                color: isCompleted ? '#a8947860' : '#e8e0d4',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                textDecoration: isCompleted ? 'line-through' : 'none',
                letterSpacing: '-0.01em',
              }}
              className="block truncate"
            >
              {item.is_chore && (
                <span style={{ color: '#d4856a', marginRight: '4px', fontSize: '12px' }}>◆</span>
              )}
              {item.title}
            </span>
          )}
        </div>

        {/* Module badge */}
        {!compact && <ModuleBadge module={item.module} size="sm" showLabel={false} />}

        {/* Recurrence badge */}
        {!compact && getRecurrenceBadge(item.recurrence) && (
          <span
            style={{
              fontSize: '9px',
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 500,
              color: '#a8947860',
              backgroundColor: '#a8947810',
              border: '1px solid #a8947815',
              borderRadius: '4px',
              padding: '1px 5px',
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            ↻ {getRecurrenceBadge(item.recurrence)}
          </span>
        )}

        {/* Due date */}
        {formatDueDate() && (
          <span
            style={{
              fontSize: '11px',
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 400,
              color: isOverdue ? '#e85d5d' : isDueToday ? '#e8a84c' : '#a8947860',
              flexShrink: 0,
            }}
          >
            {formatDueDate()}
          </span>
        )}

        {/* "..." menu button */}
        {onOpenSheet && !isCompleted && (
          <button
            onClick={handleOpenSheet}
            aria-label={`Editar detalhes: ${item.title}`}
            className="flex-shrink-0 flex items-center justify-center rounded transition-all duration-150 opacity-40 group-hover:opacity-100 focus:opacity-100"
            style={{
              width: 24,
              height: 24,
              color: '#a8947850',
              fontSize: '14px',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '2px',
              backgroundColor: 'transparent',
            }}
          >
            ···
          </button>
        )}

        {/* Expand indicator */}
        <span
          aria-hidden="true"
          className="transition-transform duration-150"
          style={{
            color: '#a8947840',
            fontSize: '10px',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ›
        </span>
      </div>

      {/* Expanded Details + Actions */}
      {expanded && (
        <div
          className="overflow-hidden transition-all duration-200"
          style={{ padding: '0 8px 10px 40px' }}
        >
          {/* Description preview */}
          {item.description && (
            <p
              className="mb-2"
              style={{
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                color: '#a8947870',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {item.description}
            </p>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {item.tags.map((tag) => (
                <TagChip key={tag} tag={tag} />
              ))}
            </div>
          )}

          {/* Energy cost */}
          {item.energy_cost !== null && (
            <div
              className="flex items-center gap-1.5 mb-2"
              style={{ fontSize: '11px', color: '#d4856a', fontFamily: 'Inter, sans-serif' }}
            >
              <span className="flex items-end gap-[1px]">
                {Array.from({ length: item.energy_cost }).map((_, i) => (
                  <span
                    key={i}
                    className="inline-block rounded-sm"
                    style={{
                      width: 2,
                      height: 3 + i * 2,
                      backgroundColor: '#d4856a',
                    }}
                  />
                ))}
              </span>
              <span style={{ opacity: 0.7 }}>
                energia {item.energy_cost}/5
              </span>
            </div>
          )}

          {/* Emotion badge */}
          {item.emotion_before && (
            <div
              className="flex items-center gap-1.5 mb-2"
              style={{ fontSize: '11px', color: '#a89478', fontFamily: 'Inter, sans-serif' }}
            >
              <span style={{ opacity: 0.5 }}>sentindo</span>
              <span style={{ fontWeight: 500 }}>{item.emotion_before}</span>
            </div>
          )}

          {/* Module (if compact hid it) */}
          {compact && item.module && (
            <div className="mb-2">
              <ModuleBadge module={item.module} size="sm" />
            </div>
          )}

          {/* Action buttons */}
          {showActions && !isCompleted && (
            <div className="flex items-center gap-2 mt-2">
              {onEdit && (
                <ActionBtn label="Editar" icon="✎" onClick={handleStartEdit} color="#c4a882" />
              )}
              {onOpenSheet && (
                <ActionBtn
                  label="Detalhes"
                  icon="◇"
                  onClick={(e) => { e.stopPropagation(); onOpenSheet(item); }}
                  color="#a89478"
                />
              )}
              {onArchive && (
                <ActionBtn
                  label="Arquivar"
                  icon="⊟"
                  onClick={(e) => { e.stopPropagation(); onArchive(item.id); }}
                  color="#a89478"
                />
              )}
              {onDelete && (
                <ActionBtn
                  label="Excluir"
                  icon="×"
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  color="#e85d5d"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Action Button

function ActionBtn({
  label,
  icon,
  onClick,
  color,
}: {
  label: string;
  icon: string;
  onClick: (e: React.MouseEvent) => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded transition-all duration-150 hover:opacity-80"
      style={{
        padding: '4px 10px',
        fontSize: '11px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        color,
        backgroundColor: `${color}12`,
        border: `1px solid ${color}25`,
      }}
    >
      <span style={{ fontSize: '12px' }}>{icon}</span>
      {label}
    </button>
  );
}

export default memo(ItemRow);
