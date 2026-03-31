// engine/insights.ts — Emotional insights engine
// Pure logic: correlations, patterns, natural language suggestions in pt-BR

import type { AtomItem, Emotion, AtomModule, SoulExtension, OperationsExtension, EnergyLevel } from '@/types/item';
import { POSITIVE_EMOTIONS, CHALLENGING_EMOTIONS, MODULES } from '@/types/item';
import { parseISO, getHours, getDay, format } from 'date-fns';

// ─── Types ──────────────────────────────────────────────────

export interface EmotionProductivity {
  emotion: Emotion;
  totalItems: number;
  completedItems: number;
  completionRate: number; // 0-100
}

export interface PeriodProductivity {
  period: 'manha' | 'tarde' | 'noite';
  label: string;
  totalCompleted: number;
  modules: { module: AtomModule; count: number }[];
  topModule: AtomModule | null;
}

export interface WeekdayPattern {
  day: number; // 0=Sunday, 6=Saturday
  label: string;
  completed: number;
  avgPositiveRatio: number;
}

export interface Insight {
  id: string;
  type: 'correlation' | 'timing' | 'pattern' | 'suggestion';
  text: string;
  priority: number; // 1=high, 3=low — for sorting
}

// ─── Constants ──────────────────────────────────────────────

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

const EMOTION_LABELS: Record<Emotion, string> = {
  calmo: 'calmo',
  focado: 'focado',
  grato: 'grato',
  animado: 'animado',
  confiante: 'confiante',
  ansioso: 'ansioso',
  cansado: 'cansado',
  frustrado: 'frustrado',
  triste: 'triste',
  perdido: 'perdido',
  neutro: 'neutro',
};

// ─── Helpers ────────────────────────────────────────────────

function getEmotionBefore(item: AtomItem): Emotion | null {
  const val = (item.body?.soul as SoulExtension | undefined)?.emotion_before;
  return (val as Emotion) ?? null;
}

function getDeadline(item: AtomItem): string | null {
  return (item.body?.operations as OperationsExtension | undefined)?.deadline ?? null;
}

function getEnergyLevel(item: AtomItem): EnergyLevel | null {
  return (item.body?.soul as SoulExtension | undefined)?.energy_level ?? null;
}

function isCompleted(item: AtomItem): boolean {
  return item.status === 'completed';
}

function isArchived(item: AtomItem): boolean {
  return item.status === 'archived';
}

// ─── Emotion → Productivity correlation ─────────────────────

function getPeriod(hour: number): 'manha' | 'tarde' | 'noite' {
  if (hour >= 5 && hour < 12) return 'manha';
  if (hour >= 12 && hour < 18) return 'tarde';
  return 'noite';
}

const PERIOD_LABELS: Record<string, string> = {
  manha: 'Manha',
  tarde: 'Tarde',
  noite: 'Noite',
};

export function computeEmotionProductivity(items: AtomItem[]): EmotionProductivity[] {
  const byEmotion = new Map<Emotion, { total: number; completed: number }>();

  for (const item of items) {
    const emotionBefore = getEmotionBefore(item);
    if (!emotionBefore || isArchived(item)) continue;
    const entry = byEmotion.get(emotionBefore) || { total: 0, completed: 0 };
    entry.total++;
    if (isCompleted(item)) entry.completed++;
    byEmotion.set(emotionBefore, entry);
  }

  return [...byEmotion.entries()]
    .filter(([, v]) => v.total >= 2) // min sample size
    .map(([emotion, { total, completed }]) => ({
      emotion,
      totalItems: total,
      completedItems: completed,
      completionRate: Math.round((completed / total) * 100),
    }))
    .sort((a, b) => b.completionRate - a.completionRate);
}

// ─── Best time of day per module ────────────────────────────

export function computePeriodProductivity(items: AtomItem[]): PeriodProductivity[] {
  const periods: Record<string, { completed: number; modules: Map<AtomModule, number> }> = {
    manha: { completed: 0, modules: new Map() },
    tarde: { completed: 0, modules: new Map() },
    noite: { completed: 0, modules: new Map() },
  };

  for (const item of items) {
    const deadline = getDeadline(item);
    if (!isCompleted(item) || !deadline || isArchived(item)) continue;
    const hour = getHours(parseISO(deadline));
    const period = getPeriod(hour);
    periods[period].completed++;
    if (item.module) {
      const count = periods[period].modules.get(item.module) || 0;
      periods[period].modules.set(item.module, count + 1);
    }
  }

  return (['manha', 'tarde', 'noite'] as const).map((p) => {
    const data = periods[p];
    const moduleEntries = [...data.modules.entries()]
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count);

    return {
      period: p,
      label: PERIOD_LABELS[p],
      totalCompleted: data.completed,
      modules: moduleEntries,
      topModule: moduleEntries.length > 0 ? moduleEntries[0].module : null,
    };
  });
}

// ─── Weekday patterns ───────────────────────────────────────

export function computeWeekdayPatterns(items: AtomItem[]): WeekdayPattern[] {
  const byDay: Record<number, { completed: number; positiveCount: number; emotionCount: number; weeks: Set<string> }> = {};
  for (let d = 0; d < 7; d++) {
    byDay[d] = { completed: 0, positiveCount: 0, emotionCount: 0, weeks: new Set() };
  }

  for (const item of items) {
    const deadline = getDeadline(item);
    if (!isCompleted(item) || !deadline || isArchived(item)) continue;
    const date = parseISO(deadline);
    const day = getDay(date);
    const weekKey = format(date, 'yyyy-ww');
    byDay[day].completed++;
    byDay[day].weeks.add(weekKey);

    const emotionBefore = getEmotionBefore(item);
    if (emotionBefore) {
      byDay[day].emotionCount++;
      if (POSITIVE_EMOTIONS.includes(emotionBefore)) {
        byDay[day].positiveCount++;
      }
    }
  }

  return [1, 2, 3, 4, 5, 6, 0].map((d) => ({
    day: d,
    label: WEEKDAY_LABELS[d],
    completed: byDay[d].completed,
    avgPositiveRatio:
      byDay[d].emotionCount > 0
        ? Math.round((byDay[d].positiveCount / byDay[d].emotionCount) * 100) / 100
        : 0,
  }));
}

// ─── Insight generation ─────────────────────────────────────

export function generateInsights(items: AtomItem[]): Insight[] {
  const insights: Insight[] = [];
  const nonArchived = items.filter((i) => !isArchived(i));

  if (nonArchived.length < 3) return insights;

  const emotionProd = computeEmotionProductivity(nonArchived);
  const periodProd = computePeriodProductivity(nonArchived);
  const weekday = computeWeekdayPatterns(nonArchived);

  // ── Emotion correlations ──

  // Best emotion for productivity
  const bestEmotion = emotionProd.find((e) => POSITIVE_EMOTIONS.includes(e.emotion));
  if (bestEmotion && bestEmotion.completionRate >= 50) {
    insights.push({
      id: 'best-emotion',
      type: 'correlation',
      text: `Quando ${EMOTION_LABELS[bestEmotion.emotion]}, voce completa ${bestEmotion.completionRate}% das tarefas`,
      priority: 1,
    });
  }

  // Worst emotion for productivity
  const worstEmotion = emotionProd
    .filter((e) => CHALLENGING_EMOTIONS.includes(e.emotion) && e.totalItems >= 2)
    .sort((a, b) => a.completionRate - b.completionRate)[0];

  if (worstEmotion && bestEmotion && bestEmotion.completionRate - worstEmotion.completionRate >= 15) {
    const diff = bestEmotion.completionRate - worstEmotion.completionRate;
    insights.push({
      id: 'worst-emotion',
      type: 'correlation',
      text: `Quando ${EMOTION_LABELS[worstEmotion.emotion]}, sua conclusao cai ${diff}% comparado a quando ${EMOTION_LABELS[bestEmotion.emotion]}`,
      priority: 1,
    });
  }

  // Emotion with most items but low completion
  const highVolumeLowCompletion = emotionProd.find(
    (e) => e.totalItems >= 4 && e.completionRate < 40
  );
  if (highVolumeLowCompletion) {
    insights.push({
      id: 'low-completion-emotion',
      type: 'correlation',
      text: `Voce inicia muitas tarefas quando ${EMOTION_LABELS[highVolumeLowCompletion.emotion]} (${highVolumeLowCompletion.totalItems}), mas completa apenas ${highVolumeLowCompletion.completionRate}%`,
      priority: 2,
    });
  }

  // ── Timing insights ──

  // Best period
  const bestPeriod = periodProd.reduce((a, b) =>
    a.totalCompleted > b.totalCompleted ? a : b
  );
  if (bestPeriod.totalCompleted > 0) {
    const total = periodProd.reduce((s, p) => s + p.totalCompleted, 0);
    const pct = total > 0 ? Math.round((bestPeriod.totalCompleted / total) * 100) : 0;
    if (pct >= 40) {
      insights.push({
        id: 'best-period',
        type: 'timing',
        text: `${bestPeriod.label} e seu periodo mais produtivo — ${pct}% das conclusoes`,
        priority: 2,
      });
    }
  }

  // Best period per module
  for (const period of periodProd) {
    if (period.topModule && period.modules[0]?.count >= 3) {
      const modLabel = MODULES.find((m) => m.key === period.topModule)?.label;
      if (modLabel) {
        insights.push({
          id: `period-module-${period.period}`,
          type: 'timing',
          text: `${modLabel} rende mais de ${period.label.toLowerCase()} (${period.modules[0].count} itens concluidos)`,
          priority: 3,
        });
      }
    }
  }

  // ── Weekday patterns ──

  const weekdaysOnly = weekday.filter((w) => w.day >= 1 && w.day <= 5);
  const weekend = weekday.filter((w) => w.day === 0 || w.day === 6);

  const bestWeekday = weekdaysOnly.reduce((a, b) =>
    a.completed > b.completed ? a : b
  );
  const worstWeekday = weekdaysOnly.reduce((a, b) =>
    a.completed < b.completed ? a : b
  );

  if (bestWeekday.completed > 0 && bestWeekday.completed > worstWeekday.completed * 1.5) {
    insights.push({
      id: 'best-weekday',
      type: 'pattern',
      text: `${bestWeekday.label} e seu dia mais produtivo da semana`,
      priority: 2,
    });
  }

  const weekendTotal = weekend.reduce((s, w) => s + w.completed, 0);
  const weekdayTotal = weekdaysOnly.reduce((s, w) => s + w.completed, 0);
  if (weekendTotal > weekdayTotal * 0.5 && weekendTotal >= 3) {
    insights.push({
      id: 'weekend-active',
      type: 'pattern',
      text: `Voce manteve atividade nos fins de semana — ${weekendTotal} itens concluidos`,
      priority: 3,
    });
  }

  // ── Suggestions ──

  // If mostly challenging emotions
  const totalEmotionItems = emotionProd.reduce((s, e) => s + e.totalItems, 0);
  const challengingItems = emotionProd
    .filter((e) => CHALLENGING_EMOTIONS.includes(e.emotion))
    .reduce((s, e) => s + e.totalItems, 0);

  if (totalEmotionItems >= 5 && challengingItems / totalEmotionItems > 0.5) {
    insights.push({
      id: 'suggestion-checkin',
      type: 'suggestion',
      text: 'Mais da metade das suas tarefas comecam com emocoes desafiadoras — considere um check-in antes de iniciar',
      priority: 1,
    });
  }

  // If high energy level items have low completion
  const highEnergy = nonArchived.filter((i) => getEnergyLevel(i) === 'high');
  if (highEnergy.length >= 3) {
    const highEnergyCompleted = highEnergy.filter((i) => isCompleted(i)).length;
    const rate = Math.round((highEnergyCompleted / highEnergy.length) * 100);
    if (rate < 50) {
      insights.push({
        id: 'suggestion-energy',
        type: 'suggestion',
        text: `Tarefas de alta energia tem ${rate}% de conclusao — tente divide-las em partes menores`,
        priority: 2,
      });
    }
  }

  return insights.sort((a, b) => a.priority - b.priority);
}
