// hooks/useItems.ts — TanStack Query wrapper + filtros derivados
import { useQuery } from '@tanstack/react-query';
import { itemService } from '@/service/item-service';
import { useAppStore } from '@/store/app-store';
import { useMemo } from 'react';
import { isToday, parseISO } from 'date-fns';

export function useItems() {
  const user = useAppStore((s) => s.user);
  const filters = useAppStore((s) => s.filters);

  const query = useQuery({
    queryKey: ['items', user?.id],
    queryFn: () => itemService.list(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });

  const items = query.data ?? [];

  // Derived filtered lists
  const filtered = useMemo(() => {
    let result = items;

    if (filters.module) {
      result = result.filter((i) => i.module === filters.module);
    }
    if (filters.priority) {
      result = result.filter((i) => i.priority === filters.priority);
    }
    if (filters.type) {
      result = result.filter((i) => i.type === filters.type);
    }
    if (!filters.showCompleted) {
      result = result.filter((i) => !i.completed);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((i) => i.title.toLowerCase().includes(q));
    }

    return result;
  }, [items, filters]);

  // Today's items
  const todayItems = useMemo(
    () => items.filter((i) => !i.completed && i.due_date && isToday(parseISO(i.due_date))),
    [items]
  );

  // Active items (NOT in today — avoids duplication on Home)
  const todayIds = useMemo(() => new Set(todayItems.map((i) => i.id)), [todayItems]);
  const activeItems = useMemo(
    () => filtered.filter((i) => !todayIds.has(i.id)),
    [filtered, todayIds]
  );

  // Inbox (no module, no parent)
  const inboxItems = useMemo(
    () => items.filter((i) => !i.completed && !i.module && !i.parent_id && i.type !== 'reflection'),
    [items]
  );

  // Chores
  const choreItems = useMemo(
    () => items.filter((i) => i.is_chore && !i.completed),
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
