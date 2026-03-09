// engine/ai-suggestions.ts — AI contextual suggestions engine
// Pure logic: analyzes emotional/productivity patterns → max 3 actionable suggestions
// All text in pt-BR

import type { AtomItem, Emotion, ItemModule } from '@/types/item';
import { POSITIVE_EMOTIONS, CHALLENGING_EMOTIONS, MODULES } from '@/types/item';
import { parseISO, getHours, isToday, isPast, startOfDay, differenceInDays, subDays } from 'date-fns';

// ─── Types ──────────────────────────────────────────────────

export interface AiSuggestion {
  id: string;
  text: string;
  action: 'reschedule' | 'break-down' | 'checkin' | 'reorder' | 'pause' | 'celebrate';
  context: string; // short explanation of why
  module: ItemModule | null;
  priority: number; // 1=highest
}

// ─── Constants ──────────────────────────────────────────────

const MAX_SUGGESTIONS = 3;
const MIN_DATA_POINTS = 5; // need at least 5 items with emotion data
const RECENT_DAYS = 14; // analyze last 2 weeks

function getPeriod(hour: number): 'manha' | 'tarde' | 'noite' {
  if (hour >= 5 && hour < 12) return 'manha';
  if (hour >= 12 && hour < 18) return 'tarde';
  return 'noite';
}

function getCurrentPeriod(): 'manha' | 'tarde' | 'noite' {
  return getPeriod(new Date().getHours());
}

const PERIOD_LABELS: Record<string, string> = {
  manha: 'manha',
  tarde: 'tarde',
  noite: 'noite',
};

const MODULE_LABELS: Record<ItemModule, string> = {
  purpose: 'Proposito',
  work: 'Trabalho',
  family: 'Familia',
  body: 'Corpo',
  mind: 'Mente',
  soul: 'Alma',
};

// ─── Core: generate contextual suggestions ───────────────────

export function generateAiSuggestions(items: AtomItem[]): AiSuggestion[] {
  const suggestions: AiSuggestion[] = [];
  const nonArchived = items.filter((i) => !i.archived);
  const cutoff = subDays(new Date(), RECENT_DAYS);
  const recentItems = nonArchived.filter((i) => parseISO(i.created_at) >= cutoff);

  if (recentItems.length < 3) return [];

  const currentPeriod = getCurrentPeriod();

  // ── 1. Procrastination pattern: module + period mismatch ──
  const procrastinationSuggestion = detectProcrastination(nonArchived, currentPeriod);
  if (procrastinationSuggestion) suggestions.push(procrastinationSuggestion);

  // ── 2. Emotion-based timing suggestion ──
  const timingSuggestion = detectEmotionTimingPattern(nonArchived, currentPeriod);
  if (timingSuggestion) suggestions.push(timingSuggestion);

  // ── 3. Overdue cluster suggestion ──
  const overdueSuggestion = detectOverdueCluster(nonArchived);
  if (overdueSuggestion) suggestions.push(overdueSuggestion);

  // ── 4. High-energy without break ──
  const energySuggestion = detectEnergyOverload(nonArchived);
  if (energySuggestion) suggestions.push(energySuggestion);

  // ── 5. Positive streak celebration ──
  const celebrationSuggestion = detectPositiveStreak(nonArchived);
  if (celebrationSuggestion) suggestions.push(celebrationSuggestion);

  // ── 6. Challenging emotion pattern in current period ──
  const emotionWarning = detectCurrentPeriodEmotionRisk(recentItems, currentPeriod);
  if (emotionWarning) suggestions.push(emotionWarning);

  // ── 7. Module imbalance ──
  const imbalanceSuggestion = detectModuleImbalance(nonArchived);
  if (imbalanceSuggestion) suggestions.push(imbalanceSuggestion);

  // Sort by priority and return max 3
  return suggestions
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_SUGGESTIONS);
}

// ─── Pattern detectors ──────────────────────────────────────

function detectProcrastination(
  items: AtomItem[],
  currentPeriod: string
): AiSuggestion | null {
  // Find modules where items get created but not completed in a specific period
  const moduleCompletionByPeriod = new Map<string, { created: number; completed: number }>();

  for (const item of items) {
    if (!item.module) continue;
    const createdHour = getHours(parseISO(item.created_at));
    const period = getPeriod(createdHour);
    const key = `${item.module}:${period}`;

    const entry = moduleCompletionByPeriod.get(key) || { created: 0, completed: 0 };
    entry.created++;
    if (item.completed) entry.completed++;
    moduleCompletionByPeriod.set(key, entry);
  }

  // Find the worst module+period combo for current period
  let worstKey: string | null = null;
  let worstRate = 1;

  for (const [key, data] of moduleCompletionByPeriod) {
    if (data.created < 3) continue; // need enough data
    const [, period] = key.split(':');
    if (period !== currentPeriod) continue;

    const rate = data.completed / data.created;
    if (rate < worstRate && rate < 0.4) {
      worstRate = rate;
      worstKey = key;
    }
  }

  if (!worstKey) return null;

  const [mod, period] = worstKey.split(':') as [ItemModule, string];
  const modLabel = MODULE_LABELS[mod];

  // Find the best period for this module
  let bestPeriod: string | null = null;
  let bestRate = 0;
  for (const [key, data] of moduleCompletionByPeriod) {
    if (!key.startsWith(`${mod}:`)) continue;
    if (data.created < 2) continue;
    const rate = data.completed / data.created;
    if (rate > bestRate) {
      bestRate = rate;
      bestPeriod = key.split(':')[1];
    }
  }

  if (bestPeriod && bestPeriod !== period) {
    return {
      id: `procrastination-${mod}`,
      text: `Tarefas de ${modLabel} rendem mais de ${PERIOD_LABELS[bestPeriod]}. Quer reagendar as de hoje?`,
      action: 'reschedule',
      context: `${Math.round(worstRate * 100)}% conclusao de ${PERIOD_LABELS[period]} vs ${Math.round(bestRate * 100)}% de ${PERIOD_LABELS[bestPeriod]}`,
      module: mod,
      priority: 1,
    };
  }

  return null;
}

function detectEmotionTimingPattern(
  items: AtomItem[],
  currentPeriod: string
): AiSuggestion | null {
  // Analyze which emotions appear in which periods and their completion rates
  const periodEmotions = new Map<string, { positive: number; challenging: number; total: number }>();

  for (const item of items) {
    if (!item.emotion_before || !item.completed) continue;
    const doneAt = item.completed_at;
    if (doneAt === null) continue;
    const hour = getHours(parseISO(doneAt));
    const period = getPeriod(hour);
    const entry = periodEmotions.get(period) || { positive: 0, challenging: 0, total: 0 };
    entry.total++;
    if (POSITIVE_EMOTIONS.includes(item.emotion_before)) entry.positive++;
    if (CHALLENGING_EMOTIONS.includes(item.emotion_before)) entry.challenging++;
    periodEmotions.set(period, entry);
  }

  const currentData = periodEmotions.get(currentPeriod);
  if (!currentData || currentData.total < MIN_DATA_POINTS) return null;

  const challengingRatio = currentData.challenging / currentData.total;

  if (challengingRatio > 0.6) {
    // Find the period with most positive emotions
    let bestPeriod: string | null = null;
    let bestPositiveRatio = 0;
    for (const [period, data] of periodEmotions) {
      if (period === currentPeriod || data.total < 3) continue;
      const ratio = data.positive / data.total;
      if (ratio > bestPositiveRatio) {
        bestPositiveRatio = ratio;
        bestPeriod = period;
      }
    }

    if (bestPeriod) {
      return {
        id: 'emotion-timing',
        text: `De ${PERIOD_LABELS[currentPeriod]}, suas emocoes tendem a ser mais desafiadoras. Tarefas leves agora, pesadas de ${PERIOD_LABELS[bestPeriod]}?`,
        action: 'reorder',
        context: `${Math.round(challengingRatio * 100)}% das tarefas de ${PERIOD_LABELS[currentPeriod]} comecam com emocoes desafiadoras`,
        module: null,
        priority: 1,
      };
    }
  }

  return null;
}

function detectOverdueCluster(items: AtomItem[]): AiSuggestion | null {
  const overdue = items.filter((i) => {
    if (i.completed || !i.due_date) return false;
    const due = new Date(i.due_date);
    return isPast(startOfDay(due)) && !isToday(due);
  });

  if (overdue.length < 3) return null;

  // Check if overdue items cluster in a module
  const moduleCounts = new Map<ItemModule, number>();
  for (const item of overdue) {
    if (item.module) {
      moduleCounts.set(item.module, (moduleCounts.get(item.module) || 0) + 1);
    }
  }

  const topModule = [...moduleCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  if (topModule && topModule[1] >= 2) {
    const [mod, count] = topModule;
    return {
      id: 'overdue-cluster',
      text: `${count} tarefas atrasadas em ${MODULE_LABELS[mod]}. Dividir em subtarefas menores ou remarcar?`,
      action: 'break-down',
      context: `${overdue.length} itens atrasados no total`,
      module: mod,
      priority: 2,
    };
  }

  if (overdue.length >= 5) {
    return {
      id: 'overdue-many',
      text: `${overdue.length} itens atrasados acumulados. Que tal revisar e remarcar os que ainda importam?`,
      action: 'reschedule',
      context: 'Acumulo pode gerar sobrecarga emocional',
      module: null,
      priority: 2,
    };
  }

  return null;
}

function detectEnergyOverload(items: AtomItem[]): AiSuggestion | null {
  // Check today's pending high-energy items
  const todayHighEnergy = items.filter((i) => {
    if (i.completed || !i.due_date) return false;
    if (!isToday(new Date(i.due_date))) return false;
    return i.energy_cost !== null && i.energy_cost >= 4;
  });

  if (todayHighEnergy.length >= 3) {
    return {
      id: 'energy-overload',
      text: `${todayHighEnergy.length} tarefas de alta energia para hoje. Considere adiar uma para amanha ou dividir em etapas.`,
      action: 'pause',
      context: 'Excesso de tarefas pesadas no mesmo dia reduz conclusao',
      module: null,
      priority: 1,
    };
  }

  return null;
}

function detectPositiveStreak(items: AtomItem[]): AiSuggestion | null {
  // Check for positive emotion streak in recent completions
  const recentCompleted = items
    .filter((i) => i.completed && i.emotion_after && i.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, 5);

  if (recentCompleted.length < 3) return null;

  const allPositive = recentCompleted.every(
    (i) => i.emotion_after && POSITIVE_EMOTIONS.includes(i.emotion_after)
  );

  if (allPositive) {
    const daysSinceFirst = differenceInDays(
      new Date(),
      parseISO(recentCompleted[recentCompleted.length - 1].completed_at!)
    );

    return {
      id: 'positive-streak',
      text: `${recentCompleted.length} tarefas seguidas com emocoes positivas! Voce esta num bom momento — aproveite para avancas itens importantes.`,
      action: 'celebrate',
      context: `Sequencia positiva nos ultimos ${daysSinceFirst} dias`,
      module: null,
      priority: 3,
    };
  }

  return null;
}

function detectCurrentPeriodEmotionRisk(
  recentItems: AtomItem[],
  currentPeriod: string
): AiSuggestion | null {
  // Look at items created in the current period over the last 2 weeks
  const periodItems = recentItems.filter((i) => {
    const hour = getHours(parseISO(i.created_at));
    return getPeriod(hour) === currentPeriod && i.emotion_before;
  });

  if (periodItems.length < MIN_DATA_POINTS) return null;

  const challenging = periodItems.filter(
    (i) => i.emotion_before && CHALLENGING_EMOTIONS.includes(i.emotion_before)
  );

  const ratio = challenging.length / periodItems.length;
  if (ratio < 0.5) return null;

  // Find the dominant challenging emotion
  const emotionCounts = new Map<Emotion, number>();
  for (const item of challenging) {
    if (item.emotion_before) {
      emotionCounts.set(item.emotion_before, (emotionCounts.get(item.emotion_before) || 0) + 1);
    }
  }

  const topEmotion = [...emotionCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!topEmotion) return null;

  return {
    id: 'period-emotion-risk',
    text: `De ${PERIOD_LABELS[currentPeriod]} voce costuma sentir ${topEmotion[0]}. Um check-in antes de comecar pode ajudar.`,
    action: 'checkin',
    context: `${Math.round(ratio * 100)}% das tarefas deste periodo comecam com emocoes desafiadoras`,
    module: null,
    priority: 2,
  };
}

function detectModuleImbalance(items: AtomItem[]): AiSuggestion | null {
  const cutoff = subDays(new Date(), RECENT_DAYS);
  const recentActive = items.filter(
    (i) => !i.completed && !i.archived && i.module && parseISO(i.created_at) >= cutoff
  );

  if (recentActive.length < 6) return null;

  const moduleCounts = new Map<ItemModule, number>();
  for (const item of recentActive) {
    if (item.module) {
      moduleCounts.set(item.module, (moduleCounts.get(item.module) || 0) + 1);
    }
  }

  const entries = [...moduleCounts.entries()].sort((a, b) => b[1] - a[1]);
  if (entries.length < 2) return null;

  const [topMod, topCount] = entries[0];
  const totalActive = entries.reduce((s, [, c]) => s + c, 0);
  const ratio = topCount / totalActive;

  if (ratio >= 0.6 && topCount >= 4) {
    const neglected = MODULES
      .filter((m) => !moduleCounts.has(m.key) || moduleCounts.get(m.key)! <= 1)
      .map((m) => m.label);

    if (neglected.length > 0) {
      return {
        id: 'module-imbalance',
        text: `${Math.round(ratio * 100)}% das tarefas recentes sao de ${MODULE_LABELS[topMod]}. ${neglected[0]} precisa de atencao?`,
        action: 'reorder',
        context: `Balanco entre areas da vida impacta bem-estar`,
        module: topMod,
        priority: 3,
      };
    }
  }

  return null;
}

// ─── Action labels for UI ───────────────────────────────────

export const ACTION_LABELS: Record<AiSuggestion['action'], string> = {
  reschedule: 'Reagendar',
  'break-down': 'Dividir',
  checkin: 'Check-in',
  reorder: 'Reorganizar',
  pause: 'Ajustar dia',
  celebrate: 'Continuar',
};

export const ACTION_COLORS: Record<AiSuggestion['action'], string> = {
  reschedule: '#c4a882',
  'break-down': '#d4856a',
  checkin: '#8a9e7a',
  reorder: '#c4a882',
  pause: '#a89478',
  celebrate: '#8a9e7a',
};
