// hooks/useAnalytics.ts — Derived analytics from items
import { useMemo } from 'react';
import { useItems } from '@/hooks/useItems';
import type { Emotion, ItemModule } from '@/types/item';
import { POSITIVE_EMOTIONS } from '@/types/item';
import {
  format,
  parseISO,
  subDays,
  isAfter,
  startOfDay,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import {
  generateInsights,
  computeEmotionProductivity,
  computePeriodProductivity,
} from '@/engine/insights';
import type { Insight, EmotionProductivity, PeriodProductivity } from '@/engine/insights';

export interface DailySnapshot {
  date: string; // yyyy-MM-dd
  completed: number;
  created: number;
  emotions: Emotion[];
  positiveRatio: number; // 0-1
}

export interface ModuleStats {
  module: ItemModule;
  total: number;
  completed: number;
  avgEnergy: number | null;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

export function useAnalytics(days: number = 30) {
  const { items, isLoading } = useItems();

  const cutoff = useMemo(() => startOfDay(subDays(new Date(), days)), [days]);

  // All completed items in the window
  const recentCompleted = useMemo(
    () =>
      items.filter(
        (i) =>
          i.completed &&
          i.completed_at &&
          isAfter(parseISO(i.completed_at), cutoff)
      ),
    [items, cutoff]
  );

  // Daily snapshots
  const dailySnapshots = useMemo((): DailySnapshot[] => {
    const interval = eachDayOfInterval({
      start: cutoff,
      end: new Date(),
    });

    return interval.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');

      const completedToday = recentCompleted.filter(
        (i) => i.completed_at && isSameDay(parseISO(i.completed_at), day)
      );

      const createdToday = items.filter((i) =>
        isSameDay(parseISO(i.created_at), day)
      );

      const emotions: Emotion[] = [];
      for (const item of [...completedToday, ...createdToday]) {
        if (item.emotion_before) emotions.push(item.emotion_before);
        if (item.emotion_after) emotions.push(item.emotion_after);
      }

      const positiveCount = emotions.filter((e) =>
        POSITIVE_EMOTIONS.includes(e)
      ).length;

      return {
        date: dateStr,
        completed: completedToday.length,
        created: createdToday.length,
        emotions,
        positiveRatio: emotions.length > 0 ? positiveCount / emotions.length : 0,
      };
    });
  }, [recentCompleted, items, cutoff]);

  // Module breakdown
  const moduleStats = useMemo((): ModuleStats[] => {
    const modules: ItemModule[] = ['purpose', 'work', 'family', 'body', 'mind', 'soul'];
    return modules.map((mod) => {
      const modItems = items.filter((i) => i.module === mod && !i.archived);
      const completed = modItems.filter((i) => i.completed);
      const energyCosts = modItems
        .filter((i) => i.energy_cost !== null)
        .map((i) => i.energy_cost!);

      return {
        module: mod,
        total: modItems.length,
        completed: completed.length,
        avgEnergy:
          energyCosts.length > 0
            ? Math.round((energyCosts.reduce((a, b) => a + b, 0) / energyCosts.length) * 10) / 10
            : null,
      };
    });
  }, [items]);

  // Completion streak
  const streak = useMemo((): StreakData => {
    const today = startOfDay(new Date());
    let current = 0;
    let longest = 0;
    let tempStreak = 0;
    let lastActive: string | null = null;

    // Walk backwards from today
    for (let i = 0; i <= days; i++) {
      const day = subDays(today, i);
      const dayCompleted = recentCompleted.filter(
        (item) => item.completed_at && isSameDay(parseISO(item.completed_at), day)
      );

      if (dayCompleted.length > 0) {
        tempStreak++;
        if (!lastActive) lastActive = format(day, 'yyyy-MM-dd');
        if (i === 0 || i === current) {
          current = tempStreak;
        }
      } else {
        longest = Math.max(longest, tempStreak);
        tempStreak = 0;
      }
    }
    longest = Math.max(longest, tempStreak);

    return { current, longest, lastActiveDate: lastActive };
  }, [recentCompleted, days]);

  // Summary stats
  const summary = useMemo(() => {
    const totalCompleted = recentCompleted.length;
    const totalActive = items.filter((i) => !i.completed && !i.archived).length;
    const totalReflections = items.filter(
      (i) => (i.type === 'reflection' || i.type === 'journal') && !i.archived
    ).length;
    const choresDone = recentCompleted.filter((i) => i.is_chore).length;

    const allEmotions: Emotion[] = [];
    for (const item of items) {
      if (item.emotion_after) allEmotions.push(item.emotion_after);
    }
    const emotionCounts = new Map<Emotion, number>();
    for (const e of allEmotions) {
      emotionCounts.set(e, (emotionCounts.get(e) || 0) + 1);
    }
    const topEmotion = allEmotions.length > 0
      ? [...emotionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      : null;

    return {
      totalCompleted,
      totalActive,
      totalReflections,
      choresDone,
      topEmotion,
      avgCompletedPerDay:
        days > 0 ? Math.round((totalCompleted / days) * 10) / 10 : 0,
    };
  }, [recentCompleted, items, days]);

  // Emotional insights
  const insights = useMemo((): Insight[] => generateInsights(items), [items]);

  const emotionProductivity = useMemo(
    (): EmotionProductivity[] => computeEmotionProductivity(items.filter((i) => !i.archived)),
    [items]
  );

  const periodProductivity = useMemo(
    (): PeriodProductivity[] => computePeriodProductivity(items.filter((i) => !i.archived)),
    [items]
  );

  return {
    dailySnapshots,
    moduleStats,
    streak,
    summary,
    insights,
    emotionProductivity,
    periodProductivity,
    isLoading,
  };
}
