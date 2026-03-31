// hooks/useItems.ts — TanStack Query wrapper + filtros derivados + virtual reset
import { useQuery } from '@tanstack/react-query';
import { itemService } from '@/service/item-service';
import { useAppStore } from '@/store/app-store';
import { useMemo } from 'react';
import { isToday, parseISO } from 'date-fns';
import { applyVirtualReset } from '@/engine/recurrence';

export function useItems() {
  const user = useAppStore((s) => s.user);
  const filters = useAppStore((s) => s.filters);

  const query = useQuery({
    queryKey: ['items', user?.id],
    queryFn: () => itemService.list(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });

  // Apply virtual reset to recurring items
  const items = useMemo(
    () => applyVirtualReset(query.data ?? []),
    [query.data]
  );

  // Derived filtered lists
  const filtered = useMemo(() => {
    let result = items;

    if (filters.module) {
      result = result.filter((i) => i.module === filters.module);
    }
    if (filters.priority) {
      result = result.filter((i) => i.body.operations?.priority === filters.priority);
    }
    if (filters.type) {
      result = result.filter((i) => i.type === filters.type);
    }
    if (!filters.showCompleted) {
      result = result.filter((i) => i.status !== 'completed');
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q) ||
        i.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, filters]);

  // Today's items
  const todayItems = useMemo(
    () => items.filter((i) => i.status !== 'completed' && i.body.operations?.due_date && isToday(parseISO(i.body.operations.due_date))),
    [items]
  );

  // Active items (NOT in today — avoids duplication on Home)
  const todayIds = useMemo(() => new Set(todayItems.map((i) => i.id)), [todayItems]);
  const activeItems = useMemo(
    () => filtered.filter((i) => !todayIds.has(i.id)),
    [filtered, todayIds]
  );

  // Inbox (no module, no project)
  const inboxItems = useMemo(
    () => items.filter((i) => i.status !== 'completed' && !i.module && !i.project_id && i.type !== 'reflection'),
    [items]
  );

  // Chores
  const choreItems = useMemo(
    () => items.filter((i) => i.tags.includes('chore') && i.status !== 'completed'),
    [items]
  );

  return {
    ...query,
    items,
    filtered,
    todayItems,
    activeItems,
    inboxItems,
    choreItems,
  };
}
