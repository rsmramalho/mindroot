// components/dashboard/DashboardView.tsx
// Composição principal do Dashboard
// Seções: Overdue → Focus → Hoje → Por Módulo → Ativo (sem data)

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AtomItem } from '@/types/item';
import {
  getOverdueItems,
  getTodayItems,
  getFocusItems,
  groupItems,
  sortItems,
  MODULE_COLORS,
} from '@/engine/dashboard-filters';
import { useThemeStore } from '@/store/theme-store';
import type { DashboardSection } from '@/engine/theme';
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
  onOpenSheet?: (item: AtomItem) => void;
}

export default function DashboardView({
  items,
  onComplete,
  onUncomplete,
  onArchive,
  onDelete,
  onEdit,
  onOpenSheet,
}: DashboardViewProps) {
  // Filtrar apenas ativos (não completados, não arquivados)
  const activeItems = useMemo(
    () => items.filter((i) => i.status !== 'completed' && i.status !== 'archived'),
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

  const dashboardOrder = useThemeStore((s) => s.dashboardOrder);
  const customModuleColors = useThemeStore((s) => s.moduleColors);

  if (activeItems.length === 0) {
    return (
      <EmptyState
        title="Tudo comeca aqui"
        description="Use o input acima para capturar sua primeira tarefa ou pensamento"
      />
    );
  }

  const itemRowProps = { onComplete, onUncomplete, onArchive, onDelete, onEdit, onOpenSheet };
  const sectionVariants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

  const renderSection = (section: DashboardSection) => {
    switch (section) {
      case 'overdue':
        return (
          <motion.div key="overdue" variants={sectionVariants}>
            <OverdueAlert items={overdueItems} />
          </motion.div>
        );
      case 'focus':
        return (
          <motion.div key="focus" variants={sectionVariants}>
            <FocusBlock items={focusItems} onComplete={onComplete} />
          </motion.div>
        );
      case 'today':
        return todayItems.length > 0 ? (
          <Section key="today" title="Hoje" count={todayItems.length} color="#e8a84c">
            {sortItems(todayItems, 'priority', 'asc').map((item) => (
              <ItemRow key={item.id} item={item} {...itemRowProps} />
            ))}
          </Section>
        ) : null;
      case 'modules':
        return moduleGroups.map((group) => {
          if (group.items.length === 0 || group.key.startsWith('_')) return null;
          const color = customModuleColors[group.key as keyof typeof customModuleColors] || MODULE_COLORS[group.key];
          return (
            <Section key={group.key} title={group.label} count={group.items.length} color={color}>
              {group.items.map((item) => (
                <ItemRow key={item.id} item={item} {...itemRowProps} />
              ))}
            </Section>
          );
        });
      case 'unclassified':
        return unclassified.length > 0 ? (
          <Section key="unclassified" title="Sem modulo" count={unclassified.length} color="#a8947860">
            {unclassified.map((item) => (
              <ItemRow key={item.id} item={item} {...itemRowProps} />
            ))}
          </Section>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="flex flex-col gap-4"
      style={{ paddingBottom: '80px' }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {dashboardOrder.map((section) => renderSection(section))}
    </motion.div>
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
    <motion.div
      className="flex flex-col gap-0.5"
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
      }}
    >
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
    </motion.div>
  );
}
