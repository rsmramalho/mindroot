// engine/recurrence.test.ts — Recurrence Engine tests
// shouldReset, isCompletedInCurrentPeriod, getNextOccurrence, applyVirtualReset
// Uses UTC-safe timestamps (T12:00Z) to avoid Brisbane timezone bug

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
    tags: [],
    status: 'active',
    state: 'inbox',
    genesis_stage: 1,
    project_id: null,
    naming_convention: null,
    notes: null,
    body: {},
    source: 'mindroot',
    created_at: '2025-01-01T12:00:00Z',
    updated_at: '2025-01-01T12:00:00Z',
    created_by: null,
    ...overrides,
  };
}

// Helper: create recurrence body with rule and optional last_completed
function withRecurrence(rule: string, lastCompleted: string | null = null, status: 'active' | 'completed' = 'active'): Partial<AtomItem> {
  return {
    status,
    body: {
      recurrence: {
        rule,
        last_completed: lastCompleted,
        streak_count: 0,
        completion_log: [] as string[],
      },
      soul: { ritual_slot: 'aurora' as const, emotion_before: null, emotion_after: null, energy_level: null, needs_checkin: false },
    },
  };
}

// Helper: create a date at noon LOCAL time on a specific date
// date-fns operates in local time, so we must use local dates
function noonUTC(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12, 0, 0);
}

// ─── shouldReset ─────────────────────────────────────────

describe('shouldReset', () => {
  it('returns false for non-recurring items', () => {
    const item = makeItem({ status: 'completed' });
    expect(shouldReset(item)).toBe(false);
  });

  it('returns false for incomplete items', () => {
    const item = makeItem(withRecurrence('daily'));
    expect(shouldReset(item)).toBe(false);
  });

  it('returns false for completed items without last_completed', () => {
    const item = makeItem(withRecurrence('daily', null, 'completed'));
    expect(shouldReset(item)).toBe(false);
  });

  // ── Daily ─────────────────────────────────────────

  describe('daily', () => {
    it('returns false when completed today', () => {
      const now = noonUTC(2025, 3, 5);
      const item = makeItem(withRecurrence('daily', '2025-03-05T08:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(false);
    });

    it('returns true when completed yesterday', () => {
      const now = noonUTC(2025, 3, 5);
      const item = makeItem(withRecurrence('daily', '2025-03-04T12:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(true);
    });

    it('returns true when completed 3 days ago', () => {
      const now = noonUTC(2025, 3, 5);
      const item = makeItem(withRecurrence('daily', '2025-03-02T12:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(true);
    });

    it('handles completion just before midnight (same day = no reset)', () => {
      const now = noonUTC(2025, 3, 5);
      const item = makeItem(withRecurrence('daily', new Date(2025, 2, 5, 23, 59, 0).toISOString(), 'completed'));
      expect(shouldReset(item, now)).toBe(false);
    });

    it('handles completion just after midnight (new day = reset)', () => {
      // completed_at is March 5 at 00:01, now is March 6 at noon
      const now = noonUTC(2025, 3, 6);
      const item = makeItem(withRecurrence('daily', '2025-03-05T00:01:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(true);
    });
  });

  // ── Weekly ────────────────────────────────────────

  describe('weekly', () => {
    it('returns false when completed this week', () => {
      // Wednesday March 5, 2025 — same week as Monday March 3
      const now = noonUTC(2025, 3, 5);
      const item = makeItem(withRecurrence('weekly', '2025-03-03T12:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(false);
    });

    it('returns true when completed last week', () => {
      // Wednesday March 5, 2025 — previous week ended Sunday March 2
      const now = noonUTC(2025, 3, 5);
      const item = makeItem(withRecurrence('weekly', '2025-02-26T12:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(true);
    });

    it('returns false on Sunday for item completed on Monday same week', () => {
      // Sunday March 9 (same week as Monday March 3 with weekStartsOn=1)
      const now = noonUTC(2025, 3, 9);
      const item = makeItem(withRecurrence('weekly', '2025-03-03T12:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(false);
    });
  });

  // ── Monthly ───────────────────────────────────────

  describe('monthly', () => {
    it('returns false when completed this month', () => {
      const now = noonUTC(2025, 3, 15);
      const item = makeItem(withRecurrence('monthly', '2025-03-01T12:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(false);
    });

    it('returns true when completed last month', () => {
      const now = noonUTC(2025, 3, 1);
      const item = makeItem(withRecurrence('monthly', '2025-02-28T12:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(true);
    });

    it('returns false on last day of month for item completed on first day', () => {
      const now = noonUTC(2025, 3, 31);
      const item = makeItem(withRecurrence('monthly', '2025-03-01T12:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(false);
    });
  });

  // ── Weekdays ──────────────────────────────────────

  describe('weekdays', () => {
    it('returns false when completed today (weekday)', () => {
      // Wednesday March 5, 2025
      const now = noonUTC(2025, 3, 5);
      const item = makeItem(withRecurrence('weekdays', '2025-03-05T12:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(false);
    });

    it('returns true when completed yesterday (weekday to weekday)', () => {
      // Wednesday March 5
      const now = noonUTC(2025, 3, 5);
      const item = makeItem(withRecurrence('weekdays', '2025-03-04T12:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(true);
    });

    it('does NOT reset on Saturday even if completed on Friday', () => {
      // Saturday March 8, 2025
      const now = noonUTC(2025, 3, 8);
      const item = makeItem(withRecurrence('weekdays', '2025-03-07T12:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(false);
    });

    it('does NOT reset on Sunday even if completed on Friday', () => {
      // Sunday March 9, 2025
      const now = noonUTC(2025, 3, 9);
      const item = makeItem(withRecurrence('weekdays', '2025-03-07T12:00:00Z', 'completed'));
      expect(shouldReset(item, now)).toBe(false);
    });

    it('resets on Monday if completed on Friday', () => {
      // Monday March 10, 2025
      const now = noonUTC(2025, 3, 10);
      const item = makeItem(withRecurrence('weekdays', '2025-03-07T12:00:00Z', 'completed'));
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
    const now = noonUTC(2025, 3, 5);
    const next = getNextOccurrence('daily', now);
    expect(next.getFullYear()).toBe(2025);
    expect(next.getMonth()).toBe(2); // March = 2
    expect(next.getDate()).toBe(6);
  });

  it('weekly: returns next Monday', () => {
    // Wednesday March 5
    const now = noonUTC(2025, 3, 5);
    const next = getNextOccurrence('weekly', now);
    expect(next.getDate()).toBe(10); // Next Monday
  });

  it('monthly: returns first of next month', () => {
    const now = noonUTC(2025, 3, 15);
    const next = getNextOccurrence('monthly', now);
    expect(next.getMonth()).toBe(3); // April = 3
    expect(next.getDate()).toBe(1);
  });

  it('weekdays: Friday returns Monday', () => {
    const friday = noonUTC(2025, 3, 7);
    const next = getNextOccurrence('weekdays', friday);
    expect(next.getDate()).toBe(10); // Monday
  });

  it('weekdays: Monday returns Tuesday', () => {
    const monday = noonUTC(2025, 3, 3);
    const next = getNextOccurrence('weekdays', monday);
    expect(next.getDate()).toBe(4); // Tuesday
  });

  it('weekdays: Saturday returns Monday', () => {
    const saturday = noonUTC(2025, 3, 8);
    const next = getNextOccurrence('weekdays', saturday);
    expect(next.getDate()).toBe(10); // Monday
  });

  it('weekdays: Sunday returns Monday', () => {
    const sunday = noonUTC(2025, 3, 9);
    const next = getNextOccurrence('weekdays', sunday);
    expect(next.getDate()).toBe(10); // Monday
  });
});

// ─── applyVirtualReset ───────────────────────────────────

describe('applyVirtualReset', () => {
  it('does not modify non-recurring items', () => {
    const items = [
      makeItem({ status: 'completed' }),
    ];
    const now = noonUTC(2025, 3, 5);
    const result = applyVirtualReset(items, now);
    expect(result[0].status).toBe('completed');
  });

  it('resets daily recurring items completed yesterday', () => {
    const items = [
      makeItem(withRecurrence('daily', '2025-03-04T12:00:00Z', 'completed')),
    ];
    const now = noonUTC(2025, 3, 5);
    const result = applyVirtualReset(items, now);
    expect(result[0].status).toBe('active');
  });

  it('does not reset daily recurring items completed today', () => {
    const items = [
      makeItem(withRecurrence('daily', '2025-03-05T08:00:00Z', 'completed')),
    ];
    const now = noonUTC(2025, 3, 5);
    const result = applyVirtualReset(items, now);
    expect(result[0].status).toBe('completed');
  });

  it('does not mutate original items', () => {
    const original = makeItem(withRecurrence('daily', '2025-03-04T12:00:00Z', 'completed'));
    const items = [original];
    const now = noonUTC(2025, 3, 5);
    applyVirtualReset(items, now);
    expect(original.status).toBe('completed'); // Original unchanged
  });

  it('handles mixed recurring and non-recurring items', () => {
    const items = [
      makeItem({ id: '1', ...withRecurrence('daily', '2025-03-04T12:00:00Z', 'completed') }),
      makeItem({ id: '2', status: 'completed' }),
      makeItem({ id: '3', ...withRecurrence('daily', '2025-03-05T08:00:00Z', 'completed') }),
      makeItem({ id: '4', status: 'active' }),
    ];
    const now = noonUTC(2025, 3, 5);
    const result = applyVirtualReset(items, now);

    expect(result[0].status).toBe('active');      // daily, completed yesterday → reset
    expect(result[1].status).toBe('completed');    // non-recurring → untouched
    expect(result[2].status).toBe('completed');    // daily, completed today → untouched
    expect(result[3].status).toBe('active');       // already active → untouched
  });
});

// ─── estimateStreak ──────────────────────────────────────

describe('estimateStreak', () => {
  it('returns 0 for non-recurring items', () => {
    const item = makeItem({ status: 'completed' });
    expect(estimateStreak(item, noonUTC(2025, 3, 5))).toBe(0);
  });

  it('returns 0 for incomplete recurring items', () => {
    const item = makeItem(withRecurrence('daily'));
    expect(estimateStreak(item, noonUTC(2025, 3, 5))).toBe(0);
  });

  it('returns 1 when completed in current period', () => {
    const item = makeItem(withRecurrence('daily', '2025-03-05T12:00:00Z', 'completed'));
    expect(estimateStreak(item, noonUTC(2025, 3, 5))).toBe(1);
  });

  it('returns 0 when completed in previous period', () => {
    const item = makeItem(withRecurrence('daily', '2025-03-04T12:00:00Z', 'completed'));
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
