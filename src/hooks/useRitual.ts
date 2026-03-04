// hooks/useRitual.ts — Ritual items per period + completion flow + virtual reset
import { useMemo } from 'react';
import { useItems } from '@/hooks/useItems';
import { useRitualStore } from '@/store/ritual-store';
import { getRandomPrompt } from '@/engine/soul';
import { applyVirtualReset } from '@/engine/recurrence';
import type { AtomItem, RitualPeriod } from '@/types/item';
import { RITUAL_PERIODS, getCurrentPeriod } from '@/types/ui';

export function useRitual() {
  const { items, isLoading } = useItems();
  const { currentPeriod } = useRitualStore();

  // All ritual items (type === 'ritual') with virtual reset applied
  const allRituals = useMemo(() => {
    const rituals = items.filter((i) => i.type === 'ritual' && !i.archived);
    return applyVirtualReset(rituals);
  }, [items]);

  // Rituals for current period
  const periodRituals = useMemo(
    () => allRituals.filter((i) => i.ritual_period === currentPeriod),
    [allRituals, currentPeriod]
  );

  // Rituals grouped by period (for full day view)
  const ritualsByPeriod = useMemo(() => {
    const grouped: Record<RitualPeriod, AtomItem[]> = {
      aurora: [],
      zenite: [],
      crepusculo: [],
    };
    for (const item of allRituals) {
      if (item.ritual_period && grouped[item.ritual_period]) {
        grouped[item.ritual_period].push(item);
      }
    }
    return grouped;
  }, [allRituals]);

  // Progress for current period
  const periodProgress = useMemo(() => {
    const total = periodRituals.length;
    if (total === 0) return { total: 0, done: 0, percent: 0 };
    const done = periodRituals.filter((i) => i.completed).length;
    return { total, done, percent: Math.round((done / total) * 100) };
  }, [periodRituals]);

  // Whether all rituals in current period are done
  const isPeriodComplete = periodProgress.total > 0 && periodProgress.done === periodProgress.total;

  // Current period config
  const periodConfig = useMemo(() => getCurrentPeriod(), [currentPeriod]);

  // Period prompt
  const periodPrompt = useMemo(
    () => getRandomPrompt(currentPeriod),
    [currentPeriod]
  );

  // Other periods config (for showing all-day view)
  const allPeriodConfigs = RITUAL_PERIODS;

  return {
    allRituals,
    periodRituals,
    ritualsByPeriod,
    periodProgress,
    isPeriodComplete,
    periodConfig,
    periodPrompt,
    allPeriodConfigs,
    isLoading,
  };
}
