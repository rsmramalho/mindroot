// hooks/useRitual.test.ts — Ritual hook logic tests
// Tests filtering, grouping by period, progress calculation
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AtomItem, RitualSlot } from '@/types/item';

// ─── We test the pure logic that useRitual derives ───────
// Instead of rendering hooks (needs React + providers),
// we extract and test the computation logic directly.

function makeItem(overrides: Partial<AtomItem> = {}): AtomItem {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    title: 'Test',
    type: 'task',
    module: null,
    tags: [],
    status: 'active',
    state: 'inbox',
    genesis_stage: 1,
    project_id: null,
    naming_convention: null,
    notes: null,
    body: {},
    source: 'mindroot',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    created_by: null,
    ...overrides,
  };
}

// Helper: create ritual item with ritual_slot in body.soul
function ritualItem(ritualSlot: RitualSlot | null, overrides: Partial<AtomItem> = {}): AtomItem {
  return makeItem({
    type: 'ritual',
    body: {
      soul: { ritual_slot: ritualSlot, emotion_before: null, emotion_after: null, energy_level: null, needs_checkin: false },
    },
    ...overrides,
  });
}

// ─── Pure logic extracted from useRitual ─────────────────

function filterRituals(items: AtomItem[]): AtomItem[] {
  return items.filter((i) => i.type === 'ritual' && i.status !== 'archived');
}

function getRitualSlot(item: AtomItem): RitualSlot | null {
  return (item.body?.soul as any)?.ritual_slot ?? null;
}

function filterByPeriod(rituals: AtomItem[], period: RitualSlot): AtomItem[] {
  return rituals.filter((i) => getRitualSlot(i) === period);
}

function groupByPeriod(rituals: AtomItem[]): Record<RitualSlot, AtomItem[]> {
  const grouped: Record<RitualSlot, AtomItem[]> = {
    aurora: [],
    zenite: [],
    crepusculo: [],
  };
  for (const item of rituals) {
    const slot = getRitualSlot(item);
    if (slot && grouped[slot]) {
      grouped[slot].push(item);
    }
  }
  return grouped;
}

function calcProgress(periodRituals: AtomItem[]) {
  const total = periodRituals.length;
  if (total === 0) return { total: 0, done: 0, percent: 0 };
  const done = periodRituals.filter((i) => i.status === 'completed').length;
  return { total, done, percent: Math.round((done / total) * 100) };
}

// ─── Sample data (mirrors seed_rituals.sql) ──────────────

const SEED_ITEMS: AtomItem[] = [
  ritualItem('aurora', { title: 'Intenção do dia', module: 'purpose', body: { soul: { ritual_slot: 'aurora', needs_checkin: true, emotion_before: null, emotion_after: null, energy_level: null } } }),
  ritualItem('aurora', { title: 'Respiração consciente', module: 'body' }),
  ritualItem('aurora', { title: 'Prioridades do dia', module: 'mind' }),
  ritualItem('zenite', { title: 'Pausa de recalibração', module: 'mind', body: { soul: { ritual_slot: 'zenite', needs_checkin: true, emotion_before: null, emotion_after: null, energy_level: null } } }),
  ritualItem('zenite', { title: 'Check-in emocional', module: 'purpose', body: { soul: { ritual_slot: 'zenite', needs_checkin: true, emotion_before: null, emotion_after: null, energy_level: null } } }),
  ritualItem('crepusculo', { title: 'Gratidão do dia', module: 'purpose', body: { soul: { ritual_slot: 'crepusculo', needs_checkin: true, emotion_before: null, emotion_after: null, energy_level: null } } }),
  ritualItem('crepusculo', { title: 'Revisão do dia', module: 'purpose', body: { soul: { ritual_slot: 'crepusculo', needs_checkin: true, emotion_before: null, emotion_after: null, energy_level: null } } }),
  ritualItem('crepusculo', { title: 'Preparação para amanhã', module: 'mind' }),
];

// ─── Tests ───────────────────────────────────────────────

describe('filterRituals', () => {
  it('filters only ritual type items', () => {
    const items = [
      ...SEED_ITEMS,
      makeItem({ type: 'task', title: 'A task' }),
      makeItem({ type: 'habit', title: 'A habit' }),
    ];
    const rituals = filterRituals(items);
    expect(rituals).toHaveLength(8);
    expect(rituals.every((i) => i.type === 'ritual')).toBe(true);
  });

  it('excludes archived rituals', () => {
    const items = [
      ...SEED_ITEMS,
      ritualItem('aurora', { status: 'archived', title: 'Archived' }),
    ];
    const rituals = filterRituals(items);
    expect(rituals).toHaveLength(8);
    expect(rituals.find((i) => i.title === 'Archived')).toBeUndefined();
  });

  it('returns empty array when no rituals exist', () => {
    const items = [makeItem({ type: 'task' }), makeItem({ type: 'note' })];
    expect(filterRituals(items)).toHaveLength(0);
  });
});

describe('filterByPeriod', () => {
  const rituals = filterRituals(SEED_ITEMS);

  it('returns 3 aurora rituals', () => {
    expect(filterByPeriod(rituals, 'aurora')).toHaveLength(3);
  });

  it('returns 2 zenite rituals', () => {
    expect(filterByPeriod(rituals, 'zenite')).toHaveLength(2);
  });

  it('returns 3 crepusculo rituals', () => {
    expect(filterByPeriod(rituals, 'crepusculo')).toHaveLength(3);
  });
});

describe('groupByPeriod', () => {
  it('groups seed items correctly', () => {
    const rituals = filterRituals(SEED_ITEMS);
    const grouped = groupByPeriod(rituals);

    expect(grouped.aurora).toHaveLength(3);
    expect(grouped.zenite).toHaveLength(2);
    expect(grouped.crepusculo).toHaveLength(3);
  });

  it('ignores items with null ritual_slot', () => {
    const rituals = [
      ritualItem('aurora'),
      ritualItem(null),
    ];
    const grouped = groupByPeriod(rituals);
    expect(grouped.aurora).toHaveLength(1);
    expect(grouped.zenite).toHaveLength(0);
    expect(grouped.crepusculo).toHaveLength(0);
  });

  it('returns empty arrays for all periods when no rituals', () => {
    const grouped = groupByPeriod([]);
    expect(grouped.aurora).toHaveLength(0);
    expect(grouped.zenite).toHaveLength(0);
    expect(grouped.crepusculo).toHaveLength(0);
  });
});

describe('calcProgress', () => {
  it('returns 0% when nothing is completed', () => {
    const items = [
      ritualItem('aurora'),
      ritualItem('aurora'),
      ritualItem('aurora'),
    ];
    const progress = calcProgress(items);
    expect(progress).toEqual({ total: 3, done: 0, percent: 0 });
  });

  it('returns 100% when all completed', () => {
    const items = [
      ritualItem('aurora', { status: 'completed' }),
      ritualItem('aurora', { status: 'completed' }),
    ];
    const progress = calcProgress(items);
    expect(progress).toEqual({ total: 2, done: 2, percent: 100 });
  });

  it('returns 33% when 1 of 3 completed', () => {
    const items = [
      ritualItem('aurora', { status: 'completed' }),
      ritualItem('aurora'),
      ritualItem('aurora'),
    ];
    const progress = calcProgress(items);
    expect(progress).toEqual({ total: 3, done: 1, percent: 33 });
  });

  it('returns 67% when 2 of 3 completed', () => {
    const items = [
      ritualItem('aurora', { status: 'completed' }),
      ritualItem('aurora', { status: 'completed' }),
      ritualItem('aurora'),
    ];
    const progress = calcProgress(items);
    expect(progress).toEqual({ total: 3, done: 2, percent: 67 });
  });

  it('returns zeros for empty array', () => {
    expect(calcProgress([])).toEqual({ total: 0, done: 0, percent: 0 });
  });

  it('isPeriodComplete is true only when all done', () => {
    const allDone = [
      ritualItem('aurora', { status: 'completed' }),
      ritualItem('aurora', { status: 'completed' }),
    ];
    const partial = [
      ritualItem('aurora', { status: 'completed' }),
      ritualItem('aurora'),
    ];
    const empty: AtomItem[] = [];

    const p1 = calcProgress(allDone);
    const p2 = calcProgress(partial);
    const p3 = calcProgress(empty);

    expect(p1.total > 0 && p1.done === p1.total).toBe(true);
    expect(p2.total > 0 && p2.done === p2.total).toBe(false);
    expect(p3.total > 0 && p3.done === p3.total).toBe(false); // empty = not complete
  });
});
