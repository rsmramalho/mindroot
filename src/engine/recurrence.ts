// engine/recurrence.ts — Recurrence Engine
// Pure functions: no React, no Supabase, no side effects.
// Determines if a recurring item should appear as "not done" for the current period.

import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isMonday,
  isTuesday,
  isWednesday,
  isThursday,
  isFriday,
  addDays,
  addWeeks,
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  parseISO,
  getDay,
} from 'date-fns';
import type { AtomItem } from '@/types/item';

// ─── Types ────────────────────────────────────────────────

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'weekdays';

export const RECURRENCE_OPTIONS: { key: RecurrenceType | 'none'; label: string }[] = [
  { key: 'none', label: 'Nenhuma' },
  { key: 'daily', label: 'Diária' },
  { key: 'weekdays', label: 'Dias úteis' },
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensal' },
];

// ─── Core: Should Reset? ─────────────────────────────────

/**
 * Determines if a recurring item should appear as "not done" for the current period.
 * Returns true if the item was completed in a PREVIOUS period and should reset.
 *
 * If the item is not recurring, not completed, or has no completed_at, returns false.
 */
export function shouldReset(item: AtomItem, now: Date = new Date()): boolean {
  // Not recurring → never reset
  if (!item.recurrence) return false;

  // Not completed → nothing to reset
  if (!item.completed) return false;

  // No completion timestamp → nothing to compare
  if (item.completed_at === null) return false;

  const completedAt = parseISO(item.completed_at);

  return !isCompletedInCurrentPeriod(item.recurrence as RecurrenceType, completedAt, now);
}

/**
 * Checks if the completion timestamp falls within the current recurrence period.
 */
export function isCompletedInCurrentPeriod(
  recurrence: RecurrenceType,
  completedAt: Date,
  now: Date = new Date()
): boolean {
  switch (recurrence) {
    case 'daily':
      return isSameDay(completedAt, now);

    case 'weekly':
      // Week starts on Monday (locale-aware)
      return isSameWeek(completedAt, now, { weekStartsOn: 1 });

    case 'monthly':
      return isSameMonth(completedAt, now);

    case 'weekdays': {
      const dayOfWeek = getDay(now);
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      // On weekends, don't reset — show last weekday completion
      if (!isWeekday) return true;
      // On weekdays, must be completed today
      return isSameDay(completedAt, now);
    }

    default:
      return false;
  }
}

// ─── Next Occurrence ──────────────────────────────────────

/**
 * Calculates the next occurrence date for a recurring item.
 * Based on the current period start.
 */
export function getNextOccurrence(
  recurrence: RecurrenceType,
  now: Date = new Date()
): Date {
  switch (recurrence) {
    case 'daily':
      return startOfDay(addDays(now, 1));

    case 'weekly':
      return startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });

    case 'monthly':
      return startOfMonth(addMonths(now, 1));

    case 'weekdays': {
      const dayOfWeek = getDay(now);
      // Friday → Monday (skip 3 days)
      if (dayOfWeek === 5) return startOfDay(addDays(now, 3));
      // Saturday → Monday (skip 2 days)
      if (dayOfWeek === 6) return startOfDay(addDays(now, 2));
      // Sunday → Monday (skip 1 day)
      if (dayOfWeek === 0) return startOfDay(addDays(now, 1));
      // Mon-Thu → next day
      return startOfDay(addDays(now, 1));
    }

    default:
      return startOfDay(addDays(now, 1));
  }
}

// ─── Streak Estimation ───────────────────────────────────

/**
 * Estimates streak from the item's completed_at relative to now.
 * Without a completion history table, we can only determine:
 * - 0: not completed in current period
 * - 1: completed in current period (at least 1)
 *
 * Returns the estimated streak count.
 */
export function estimateStreak(item: AtomItem, now: Date = new Date()): number {
  if (!item.recurrence || !item.completed) return 0;
  if (item.completed_at === null) return 0;

  const completedAt = parseISO(item.completed_at);
  const recurrence = item.recurrence as RecurrenceType;

  if (!isCompletedInCurrentPeriod(recurrence, completedAt, now)) return 0;

  // We can only confirm it's done for the current period
  // Real streak tracking would need a completion_log table
  return 1;
}

// ─── Virtual Reset Helper ─────────────────────────────────

/**
 * Applies virtual reset to a list of items.
 * Returns a new array where recurring items that should reset
 * have completed=false and completed_at=null (in memory only).
 *
 * The original items are NOT mutated.
 */
export function applyVirtualReset(items: AtomItem[], now: Date = new Date()): AtomItem[] {
  return items.map((item) => {
    if (shouldReset(item, now)) {
      return {
        ...item,
        completed: false,
        completed_at: null,
        // Keep a reference to the actual DB state for streak display
        _wasCompletedBefore: true,
      } as AtomItem;
    }
    return item;
  });
}

// ─── Labels ───────────────────────────────────────────────

/**
 * Returns a human-readable label for a recurrence type.
 */
export function getRecurrenceLabel(recurrence: string | null): string | null {
  if (!recurrence) return null;

  const option = RECURRENCE_OPTIONS.find((o) => o.key === recurrence);
  if (option && option.key !== 'none') return option.label;
  return null;
}

/**
 * Returns a short badge label (for ItemRow).
 */
export function getRecurrenceBadge(recurrence: string | null): string | null {
  if (!recurrence) return null;

  switch (recurrence) {
    case 'daily': return 'dia';
    case 'weekly': return 'sem';
    case 'monthly': return 'mês';
    case 'weekdays': return 'útil';
    default: return null;
  }
}

// ─── Weekday check ────────────────────────────────────────

export function isWeekday(date: Date = new Date()): boolean {
  const day = getDay(date);
  return day >= 1 && day <= 5;
}
