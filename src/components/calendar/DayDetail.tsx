// components/calendar/DayDetail.tsx
// Shows items for a selected day in the calendar

import { useMemo } from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AtomItem } from '@/types/item';
import ItemRow from '@/components/shared/ItemRow';
import EmptyState from '@/components/shared/EmptyState';

interface DayDetailProps {
  date: Date;
  items: AtomItem[];
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onEdit: (id: string, updates: Partial<AtomItem>) => void;
}

export default function DayDetail({
  date,
  items,
  onComplete,
  onUncomplete,
  onDelete,
  onArchive,
  onEdit,
}: DayDetailProps) {
  const dayItems = useMemo(() => {
    return items.filter((i) => {
      if (!i.due_date) return false;
      return isSameDay(new Date(i.due_date), date);
    });
  }, [items, date]);

  const pending = dayItems.filter((i) => !i.completed);
  const done = dayItems.filter((i) => i.completed);

  const today = isToday(date);
  const dateLabel = today
    ? 'Hoje'
    : format(date, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div
      className="rounded-lg mt-3"
      style={{
        backgroundColor: '#1a1d24',
        border: '1px solid #a8947810',
        padding: '14px',
      }}
    >
      {/* Date header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="capitalize"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '16px',
            fontWeight: 400,
            color: today ? '#e8e0d4' : '#a89478cc',
          }}
        >
          {dateLabel}
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
            color: '#a8947840',
          }}
        >
          {dayItems.length}
        </span>
      </div>

      {dayItems.length === 0 && (
        <EmptyState
          title="Dia livre"
          description="Nenhum item agendado"
          positive
        />
      )}

      {/* Pending items */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {pending.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onComplete={onComplete}
              onUncomplete={onUncomplete}
              onDelete={onDelete}
              onArchive={onArchive}
              onEdit={onEdit}
              compact
            />
          ))}
        </div>
      )}

      {/* Done items */}
      {done.length > 0 && (
        <div className="flex flex-col gap-0.5 mt-2">
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              fontWeight: 600,
              color: '#8a9e7a60',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '4px 4px 2px',
            }}
          >
            Concluídas
          </span>
          {done.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onComplete={onComplete}
              onUncomplete={onUncomplete}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}
