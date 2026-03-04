// engine/recurrence.test.ts — Recurrence Engine tests
// shouldReset, isCompletedInCurrentPeriod, getNextOccurrence, applyVirtualReset
// Uses local noon dates — date-fns operates in local time

import { describe, it, expect } from 'vitest';
import {
  shouldReset,
  isCompletedInCurrentPeriod,
  getNextOccurrence,
  applyVirtualReset,
  getRecurrenceLabel,
  getRecurrenceBadge,
  estimateStreak,
  isWeekday,
  RECURRENCE_OPTIONS,
} from './recurrence';
import type { AtomItem } from '@/types/item';

// ─── Factory ─────────────────────────────────────────────

function makeItem(overrides: Partial<AtomItem> = {}): AtomItem {
  return {
    id: 'test-id',
    user_id: 'user-id',
    title: 'Test ritual',
    type: 'ritual',
    module: 'mind',
    priority: null,
    tags: [],
    parent_id: null,
    completed: false,
    completed_at: null,
    archived: false,
    due_date: null,
    due_time: null,
    recurrence: null,
    ritual_period: 'aurora',
    emotion_before: null,
    emotion_after: null,
    needs_checkin: false,
    is_chore: false,
    energy_cost: null,
    description: null,
    context: null,
    created_at: '2025-01-01T12:00:00Z',
    updated_at: '2025-01-01T12:00:00Z',
    ...overrides,
  };
}

// Helper: create a date at noon local time on a specific date
// date-fns operates in local time, so tests must use local dates
function noon(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12, 0, 0);
}

// Helper: create an ISO string at noon local for completed_at fields
function noonISO(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
}

// Alias for backward compat in test code
const noonUTC = noon;

// ─── shouldReset ─────────────────────────────────────────

describe('shouldReset', () => {
  it('returns false for non-recurring items', () => {
    const item = makeItem({ completed: true, completed_at: '2025-03-01T12:00:00Z' });
    expect(shouldReset(item)).toBe(false);
  });

  it('returns false for incomplete items', () => {
    const item = makeItem({ recurrence: 'daily', completed: false });
    expect(shouldReset(item)).toBe(false);
  });

  it('returns false for completed items without completed_at', () => {
    const item = makeItem({ recurrence: 'daily', completed: true, completed_at: null });
    expect(shouldReset(item)).toBe(false);
  });

  // ── Daily ─────────────────────────────────────────

  describe('daily', () => {
    it('returns false when completed today', () => {
      const now = noonUTC(2025, 3, 5);
      const item = makeItem({
        recurrence: 'daily',
        completed: true,
        completed_at: '2025-03-05T08:00:00Z',
      });
      expect(shouldReset(item, now)).toBe(false);
    });

    it('returns true when completed yesterday', () => {
      const now = noonUTC(2025, 3, 5);
      const item = makeItem({
        recurrence: 'daily',
        completed: true,
        completed_at: '2025-03-04T12:00:00Z',
      });
      expect(shouldReset(item, now)).toBe(true);
    });

    it('returns true when completed 3 days ago', () => {
      const now = noonUTC(2025, 3, 5);
      const item = makeItem({
        recurrence: 'daily',
        completed: true,
        completed_at: '2025-03-02T12:00:00Z',
      });
      expect(shouldReset(item, now)).toBe(true);
    });

    it('handles completion just before midnight (same day = no reset)', () => {
      const now = noon(2025, 3, 5);
      // Use local 23:59 so it stays on the same local day
      const lateNight = new Date(2025, 2, 5, 23, 59, 0);
      const item = makeItem({
        recurrence: 'daily',
        completed: true,
        completed_at: lateNight.toISOString(),
      });
      expect(shouldReset(item, now)).toBe(false);
    });

    it('handles completion just after midnight (new day = reset)', () => {
      // completed_at is March 5 at 00:01, now is March 6 at noon
      const now = noonUTC(2025, 3, 6);
      const item = makeItem({
        recurrence: 'daily',
        completed: true,
        completed_at: '2025-03-05T00:01:00Z',
      });
      expect(shouldReset(item, now)).toBe(true);
    });
  });

  // ── Weekly ────────────────────────────────────────

  describe('weekly', () => {
    it('returns false when completed this week', () => {
      // Wednesday March 5, 2025 — same week as Monday March 3
      const now = noonUTC(2025, 3, 5);
      const item = makeItem({
        recurrence: 'weekly',
        completed: true,
        completed_at: '2025-03-03T12:00:00Z', // Monday
      });
      expect(shouldReset(item, now)).toBe(false);
    });

    it('returns true when completed last week', () => {
      // Wednesday March 5, 2025 — previous week ended Sunday March 2
      const now = noonUTC(2025, 3, 5);
      const item = makeItem({
        recurrence: 'weekly',
        completed: true,
        completed_at: '2025-02-26T12:00:00Z', // Previous Wednesday
      });
      expect(shouldReset(item, now)).toBe(true);
    });

    it('returns false on Sunday for item completed on Monday same week', () => {
      // Sunday March 9 (same week as Monday March 3 with weekStartsOn=1)
      const now = noonUTC(2025, 3, 9);
      const item = makeItem({
        recurrence: 'weekly',
        completed: true,
        completed_at: '2025-03-03T12:00:00Z', // Monday
      });
      expect(shouldReset(item, now)).toBe(false);
    });
  });

  // ── Monthly ───────────────────────────────────────

  describe('monthly', () => {
    it('returns false when completed this month', () => {
      const now = noonUTC(2025, 3, 15);
      const item = makeItem({
        recurrence: 'monthly',
        completed: true,
        completed_at: '2025-03-01T12:00:00Z',
      });
      expect(shouldReset(item, now)).toBe(false);
    });

    it('returns true when completed last month', () => {
      const now = noonUTC(2025, 3, 1);
      const item = makeItem({
        recurrence: 'monthly',
        completed: true,
        completed_at: '2025-02-28T12:00:00Z',
      });
      expect(shouldReset(item, now)).toBe(true);
    });

    it('returns false on last day of month for item completed on first day', () => {
      const now = noonUTC(2025, 3, 31);
      const item = makeItem({
        recurrence: 'monthly',
        completed: true,
        completed_at: '2025-03-01T12:00:00Z',
      });
      expect(shouldReset(item, now)).toBe(false);
    });
  });

  // ── Weekdays ──────────────────────────────────────

  describe('weekdays', () => {
    it('returns false when completed today (weekday)', () => {
      // Wednesday March 5, 2025
      const now = noonUTC(2025, 3, 5);
      const item = makeItem({
        recurrence: 'weekdays',
        completed: true,
        completed_at: '2025-03-05T12:00:00Z',
      });
      expect(shouldReset(item, now)).toBe(false);
    });

    it('returns true when completed yesterday (weekday to weekday)', () => {
      // Wednesday March 5
      const now = noonUTC(2025, 3, 5);
      const item = makeItem({
        recurrence: 'weekdays',
        completed: true,
        completed_at: '2025-03-04T12:00:00Z', // Tuesday
      });
      expect(shouldReset(item, now)).toBe(true);
    });

    it('does NOT reset on Saturday even if completed on Friday', () => {
      // Saturday March 8, 2025
      const now = noonUTC(2025, 3, 8);
      const item = makeItem({
        recurrence: 'weekdays',
        completed: true,
        completed_at: '2025-03-07T12:00:00Z', // Friday
      });
      expect(shouldReset(item, now)).toBe(false);
    });

    it('does NOT reset on Sunday even if completed on Friday', () => {
      // Sunday March 9, 2025
      const now = noonUTC(2025, 3, 9);
      const item = makeItem({
        recurrence: 'weekdays',
        completed: true,
        completed_at: '2025-03-07T12:00:00Z', // Friday
      });
      expect(shouldReset(item, now)).toBe(false);
    });

    it('resets on Monday if completed on Friday', () => {
      // Monday March 10, 2025
      const now = noonUTC(2025, 3, 10);
      const item = makeItem({
        recurrence: 'weekdays',
        completed: true,
        completed_at: '2025-03-07T12:00:00Z', // Friday
      });
      expect(shouldReset(item, now)).toBe(true);
    });
  });
});

// ─── isCompletedInCurrentPeriod ──────────────────────────

describe('isCompletedInCurrentPeriod', () => {
  it('daily: same day returns true', () => {
    const now = noonUTC(2025, 3, 5);
    const completedAt = new Date('2025-03-05T08:30:00Z');
    expect(isCompletedInCurrentPeriod('daily', completedAt, now)).toBe(true);
  });

  it('daily: different day returns false', () => {
    const now = noonUTC(2025, 3, 5);
    const completedAt = new Date('2025-03-04T08:30:00Z');
    expect(isCompletedInCurrentPeriod('daily', completedAt, now)).toBe(false);
  });

  it('weekdays: returns true on weekend regardless of completed_at', () => {
    const saturday = noonUTC(2025, 3, 8);
    const completedAt = new Date('2025-03-03T12:00:00Z'); // 5 days ago
    expect(isCompletedInCurrentPeriod('weekdays', completedAt, saturday)).toBe(true);
  });
});

// ─── getNextOccurrence ───────────────────────────────────

describe('getNextOccurrence', () => {
  it('daily: returns tomorrow', () => {
    const now = noon(2025, 3, 5);
    const next = getNextOccurrence('daily', now);
    expect(next.getFullYear()).toBe(2025);
    expect(next.getMonth()).toBe(2); // March = 2
    expect(next.getDate()).toBe(6);
  });

  it('weekly: returns next Monday', () => {
    // Wednesday March 5
    const now = noon(2025, 3, 5);
    const next = getNextOccurrence('weekly', now);
    expect(next.getDate()).toBe(10); // Next Monday
  });

  it('monthly: returns first of next month', () => {
    const now = noon(2025, 3, 15);
    const next = getNextOccurrence('monthly', now);
    expect(next.getMonth()).toBe(3); // April = 3
    expect(next.getDate()).toBe(1);
  });

  it('weekdays: Friday returns Monday', () => {
    const friday = noon(2025, 3, 7);
    const next = getNextOccurrence('weekdays', friday);
    expect(next.getDate()).toBe(10); // Monday
  });

  it('weekdays: Monday returns Tuesday', () => {
    const monday = noon(2025, 3, 3);
    const next = getNextOccurrence('weekdays', monday);
    expect(next.getDate()).toBe(4); // Tuesday
  });

  it('weekdays: Saturday returns Monday', () => {
    const saturday = noon(2025, 3, 8);
    const next = getNextOccurrence('weekdays', saturday);
    expect(next.getDate()).toBe(10); // Monday
  });

  it('weekdays: Sunday returns Monday', () => {
    const sunday = noon(2025, 3, 9);
    const next = getNextOccurrence('weekdays', sunday);
    expect(next.getDate()).toBe(10); // Monday
  });
});

// ─── applyVirtualReset ───────────────────────────────────

describe('applyVirtualReset', () => {
  it('does not modify non-recurring items', () => {
    const items = [
      makeItem({ completed: true, completed_at: '2025-03-01T12:00:00Z' }),
    ];
    const now = noonUTC(2025, 3, 5);
    const result = applyVirtualReset(items, now);
    expect(result[0].completed).toBe(true);
  });

  it('resets daily recurring items completed yesterday', () => {
    const items = [
      makeItem({
        recurrence: 'daily',
        completed: true,
        completed_at: '2025-03-04T12:00:00Z',
      }),
    ];
    const now = noonUTC(2025, 3, 5);
    const result = applyVirtualReset(items, now);
    expect(result[0].completed).toBe(false);
    expect(result[0].completed_at).toBeNull();
  });

  it('does not reset daily recurring items completed today', () => {
    const items = [
      makeItem({
        recurrence: 'daily',
        completed: true,
        completed_at: '2025-03-05T08:00:00Z',
      }),
    ];
    const now = noonUTC(2025, 3, 5);
    const result = applyVirtualReset(items, now);
    expect(result[0].completed).toBe(true);
  });

  it('does not mutate original items', () => {
    const original = makeItem({
      recurrence: 'daily',
      completed: true,
      completed_at: '2025-03-04T12:00:00Z',
    });
    const items = [original];
    const now = noonUTC(2025, 3, 5);
    applyVirtualReset(items, now);
    expect(original.completed).toBe(true); // Original unchanged
  });

  it('handles mixed recurring and non-recurring items', () => {
    const items = [
      makeItem({ id: '1', recurrence: 'daily', completed: true, completed_at: '2025-03-04T12:00:00Z' }),
      makeItem({ id: '2', completed: true, completed_at: '2025-03-04T12:00:00Z' }),
      makeItem({ id: '3', recurrence: 'daily', completed: true, completed_at: '2025-03-05T08:00:00Z' }),
      makeItem({ id: '4', completed: false }),
    ];
    const now = noonUTC(2025, 3, 5);
    const result = applyVirtualReset(items, now);

    expect(result[0].completed).toBe(false);  // daily, completed yesterday → reset
    expect(result[1].completed).toBe(true);    // non-recurring → untouched
    expect(result[2].completed).toBe(true);    // daily, completed today → untouched
    expect(result[3].completed).toBe(false);   // already incomplete → untouched
  });
});

// ─── estimateStreak ──────────────────────────────────────

describe('estimateStreak', () => {
  it('returns 0 for non-recurring items', () => {
    const item = makeItem({ completed: true, completed_at: '2025-03-05T12:00:00Z' });
    expect(estimateStreak(item, noonUTC(2025, 3, 5))).toBe(0);
  });

  it('returns 0 for incomplete recurring items', () => {
    const item = makeItem({ recurrence: 'daily', completed: false });
    expect(estimateStreak(item, noonUTC(2025, 3, 5))).toBe(0);
  });

  it('returns 1 when completed in current period', () => {
    const item = makeItem({
      recurrence: 'daily',
      completed: true,
      completed_at: '2025-03-05T12:00:00Z',
    });
    expect(estimateStreak(item, noonUTC(2025, 3, 5))).toBe(1);
  });

  it('returns 0 when completed in previous period', () => {
    const item = makeItem({
      recurrence: 'daily',
      completed: true,
      completed_at: '2025-03-04T12:00:00Z',
    });
    expect(estimateStreak(item, noonUTC(2025, 3, 5))).toBe(0);
  });
});

// ─── Labels ──────────────────────────────────────────────

describe('getRecurrenceLabel', () => {
  it('returns null for null', () => {
    expect(getRecurrenceLabel(null)).toBeNull();
  });

  it('returns correct labels', () => {
    expect(getRecurrenceLabel('daily')).toBe('Diária');
    expect(getRecurrenceLabel('weekly')).toBe('Semanal');
    expect(getRecurrenceLabel('monthly')).toBe('Mensal');
    expect(getRecurrenceLabel('weekdays')).toBe('Dias úteis');
  });

  it('returns null for unknown recurrence', () => {
    expect(getRecurrenceLabel('custom')).toBeNull();
  });
});

describe('getRecurrenceBadge', () => {
  it('returns null for null', () => {
    expect(getRecurrenceBadge(null)).toBeNull();
  });

  it('returns short labels', () => {
    expect(getRecurrenceBadge('daily')).toBe('dia');
    expect(getRecurrenceBadge('weekly')).toBe('sem');
    expect(getRecurrenceBadge('monthly')).toBe('mês');
    expect(getRecurrenceBadge('weekdays')).toBe('útil');
  });
});

// ─── isWeekday ───────────────────────────────────────────

describe('isWeekday', () => {
  it('returns true for Monday-Friday', () => {
    expect(isWeekday(noonUTC(2025, 3, 3))).toBe(true);  // Monday
    expect(isWeekday(noonUTC(2025, 3, 4))).toBe(true);  // Tuesday
    expect(isWeekday(noonUTC(2025, 3, 5))).toBe(true);  // Wednesday
    expect(isWeekday(noonUTC(2025, 3, 6))).toBe(true);  // Thursday
    expect(isWeekday(noonUTC(2025, 3, 7))).toBe(true);  // Friday
  });

  it('returns false for Saturday and Sunday', () => {
    expect(isWeekday(noonUTC(2025, 3, 8))).toBe(false); // Saturday
    expect(isWeekday(noonUTC(2025, 3, 9))).toBe(false); // Sunday
  });
});

// ─── RECURRENCE_OPTIONS ──────────────────────────────────

describe('RECURRENCE_OPTIONS', () => {
  it('has 5 options including none', () => {
    expect(RECURRENCE_OPTIONS).toHaveLength(5);
  });

  it('first option is none', () => {
    expect(RECURRENCE_OPTIONS[0].key).toBe('none');
  });

  it('all options have non-empty labels', () => {
    for (const opt of RECURRENCE_OPTIONS) {
      expect(opt.label.length).toBeGreaterThan(0);
    }
  });
});
