// hooks/useJournal.ts — Journal + reflection items grouped by date
import { useMemo } from 'react';
import { useItems } from '@/hooks/useItems';
import type { AtomItem } from '@/types/item';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface JournalGroup {
  label: string;
  date: string; // ISO date string
  entries: AtomItem[];
}

export function useJournal() {
  const { items, isLoading } = useItems();

  // All journal-type items (reflections + log entries)
  const journalItems = useMemo(
    () =>
      items
        .filter(
          (i) =>
            (i.type === 'reflection' || i.type === 'log') && i.status !== 'archived'
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
    [items]
  );

  // Grouped by date
  const grouped = useMemo(() => {
    const groups: Map<string, AtomItem[]> = new Map();

    for (const item of journalItems) {
      const dateKey = format(parseISO(item.created_at), 'yyyy-MM-dd');
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(item);
    }

    const result: JournalGroup[] = [];
    for (const [dateKey, entries] of groups) {
      const date = parseISO(dateKey);
      let label: string;
      if (isToday(date)) {
        label = 'Hoje';
      } else if (isYesterday(date)) {
        label = 'Ontem';
      } else {
        label = format(date, "d 'de' MMMM", { locale: ptBR });
      }
      result.push({ label, date: dateKey, entries });
    }

    return result;
  }, [journalItems]);

  // Stats
  const stats = useMemo(() => {
    const total = journalItems.length;
    const withEmotion = journalItems.filter(
      (i) => i.body.soul?.emotion_before || i.body.soul?.emotion_after
    ).length;
    const todayCount = journalItems.filter((i) =>
      isToday(parseISO(i.created_at))
    ).length;
    return { total, withEmotion, todayCount };
  }, [journalItems]);

  return {
    journalItems,
    grouped,
    stats,
    isLoading,
  };
}
