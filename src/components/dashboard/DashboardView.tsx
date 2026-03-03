// components/dashboard/DashboardView.tsx
// Composição principal do Dashboard
// Seções: Overdue → Focus → Hoje → Por Módulo → Ativo (sem data)

import { useMemo } from 'react';
import type { AtomItem } from '@/types/item';
import {
  getOverdueItems,
  getTodayItems,
  getFocusItems,
  groupItems,
  sortItems,
  MODULE_COLORS,
} from '@/engine/dashboard-filters';
import OverdueAlert from './OverdueAlert';
import FocusBlock from './FocusBlock';
import ItemRow from '@/components/shared/ItemRow';
import EmptyState from '@/components/shared/EmptyState';

interface DashboardViewProps {
  items: AtomItem[];
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<AtomItem>) => void;
}

export default function DashboardView({
  items,
  onComplete,
  onUncomplete,
  onArchive,
  onDelete,
  onEdit,
}: DashboardViewProps) {
  // Filtrar apenas ativos (não completados, não arquivados)
  const activeItems = useMemo(
    () => items.filter((i) => !i.completed && !i.archived),
    [items]
  );

  const overdueItems = useMemo(() => getOverdueItems(activeItems), [activeItems]);
  const focusItems = useMemo(() => getFocusItems(activeItems), [activeItems]);
  const todayItems = useMemo(() => getTodayItems(activeItems), [activeItems]);

  // Items por módulo (excluindo os que já estão em focus/today/overdue pra não duplicar)
  const focusTodayIds = useMemo(() => {
    const ids = new Set<string>();
    focusItems.forEach((i) => ids.add(i.id));
    todayItems.forEach((i) => ids.add(i.id));
    overdueItems.forEach((i) => ids.add(i.id));
    return ids;
  }, [focusItems, todayItems, overdueItems]);

  const remainingItems = useMemo(
    () => activeItems.filter((i) => !focusTodayIds.has(i.id) && i.module),
    [activeItems, focusTodayIds]
  );

  const moduleGroups = useMemo(
    () => groupItems(sortItems(remainingItems, 'due_date', 'asc'), 'module'),
    [remainingItems]
  );

  // Items sem módulo e sem data (inbox-like, mas que tem algo)
  const unclassified = useMemo(
    () => activeItems.filter((i) => !focusTodayIds.has(i.id) && !i.module),
    [activeItems, focusTodayIds]
  );

  if (activeItems.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-4" style={{ paddingBottom: '80px' }}>
      {/* ━━━ Overdue Alert ━━━ */}
      <OverdueAlert items={overdueItems} />

      {/* ━━━ Focus Block ━━━ */}
      <FocusBlock items={focusItems} onComplete={onComplete} />

      {/* ━━━ Hoje ━━━ */}
      {todayItems.length > 0 && (
        <Section title="Hoje" count={todayItems.length} color="#e8a84c">
          {sortItems(todayItems, 'priority', 'asc').map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onComplete={onComplete}
              onUncomplete={onUncomplete}
              onArchive={onArchive}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </Section>
      )}

      {/* ━━━ Por Módulo ━━━ */}
      {moduleGroups.map((group) => {
        if (group.items.length === 0 || group.key.startsWith('_')) return null;
        return (
          <Section
            key={group.key}
            title={group.label}
            count={group.items.length}
            color={MODULE_COLORS[group.key]}
          >
            {group.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onComplete={onComplete}
                onUncomplete={onUncomplete}
                onArchive={onArchive}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </Section>
        );
      })}

      {/* ━━━ Sem módulo (classificar) ━━━ */}
      {unclassified.length > 0 && (
        <Section title="Sem módulo" count={unclassified.length} color="#a8947860">
          {unclassified.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onComplete={onComplete}
              onUncomplete={onUncomplete}
              onArchive={onArchive}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

// ━━━ Section Component ━━━

function Section({
  title,
  count,
  color,
  children,
}: {
  title: string;
  count: number;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2" style={{ padding: '0 4px' }}>
        {color && (
          <span
            className="inline-block rounded-full"
            style={{ width: 4, height: 4, backgroundColor: color }}
          />
        )}
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            color: color || '#a8947840',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: '10px',
            fontFamily: '"JetBrains Mono", monospace',
            color: '#a8947840',
          }}
        >
          {count}
        </span>
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
