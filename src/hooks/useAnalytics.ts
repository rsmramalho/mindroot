// hooks/useAnalytics.ts — Derived analytics from items
import { useMemo } from 'react';
import { useItems } from '@/hooks/useItems';
import type { Emotion, AtomModule } from '@/types/item';
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
  module: AtomModule;
  total: number;
  completed: number;
  avgEnergy: string | null;
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
          i.status === 'completed' &&
          i.body.recurrence?.last_completed &&
          isAfter(parseISO(i.body.recurrence.last_completed), cutoff)
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
        (i) => i.body.recurrence?.last_completed && isSameDay(parseISO(i.body.recurrence.last_completed), day)
      );

      const createdToday = items.filter((i) =>
        isSameDay(parseISO(i.created_at), day)
      );

      const emotions: Emotion[] = [];
      for (const item of [...completedToday, ...createdToday]) {
        if (item.body.soul?.emotion_before) emotions.push(item.body.soul.emotion_before as Emotion);
        if (item.body.soul?.emotion_after) emotions.push(item.body.soul.emotion_after as Emotion);
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
    const modules: AtomModule[] = ['purpose', 'work', 'family', 'body', 'mind', 'bridge', 'finance', 'social'];
    return modules.map((mod) => {
      const modItems = items.filter((i) => i.module === mod && i.status !== 'archived');
      const completed = modItems.filter((i) => i.status === 'completed');

      // Collect energy levels and compute most common
      const energyLevels = modItems
        .filter((i) => i.body.soul?.energy_level != null)
        .map((i) => i.body.soul!.energy_level!);

      let avgEnergy: string | null = null;
      if (energyLevels.length > 0) {
        const counts: Record<string, number> = {};
        for (const e of energyLevels) {
          counts[e] = (counts[e] || 0) + 1;
        }
        avgEnergy = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      }

      return {
        module: mod,
        total: modItems.length,
        completed: completed.length,
        avgEnergy,
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
        (item) => item.body.recurrence?.last_completed && isSameDay(parseISO(item.body.recurrence.last_completed), day)
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
    const totalActive = items.filter((i) => i.status === 'active').length;
    const totalReflections = items.filter(
      (i) => (i.type === 'reflection' || i.type === 'log') && i.status !== 'archived'
    ).length;
    const choresDone = recentCompleted.filter((i) => i.tags.includes('chore')).length;

    const allEmotions: Emotion[] = [];
    for (const item of items) {
      if (item.body.soul?.emotion_after) allEmotions.push(item.body.soul.emotion_after as Emotion);
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
    (): EmotionProductivity[] => computeEmotionProductivity(items.filter((i) => i.status !== 'archived')),
    [items]
  );

  const periodProductivity = useMemo(
    (): PeriodProductivity[] => computePeriodProductivity(items.filter((i) => i.status !== 'archived')),
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
