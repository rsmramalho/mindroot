// hooks/useJournal.test.ts — Journal hook logic tests
// Tests filtering, date grouping, stats calculation
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { AtomItem, SoulExtension } from '@/types/item';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Factory ─────────────────────────────────────────────

function makeItem(overrides: Partial<AtomItem> = {}): AtomItem {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    title: 'Test entry',
    type: 'log',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    ...overrides,
  };
}

// Helper to get emotion from body.soul
function getEmotionBefore(item: AtomItem): string | null {
  return (item.body?.soul as SoulExtension | undefined)?.emotion_before ?? null;
}

function getEmotionAfter(item: AtomItem): string | null {
  return (item.body?.soul as SoulExtension | undefined)?.emotion_after ?? null;
}

// ─── Pure logic extracted from useJournal ────────────────

function filterJournalItems(items: AtomItem[]): AtomItem[] {
  return items
    .filter(
      (i) =>
        (i.type === 'reflection' || i.type === 'log') && i.status !== 'archived'
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

interface JournalGroup {
  label: string;
  date: string;
  entries: AtomItem[];
}

function groupByDate(journalItems: AtomItem[]): JournalGroup[] {
  const groups: Map<string, AtomItem[]> = new Map();

  for (const item of journalItems) {
    const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(item);
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const result: JournalGroup[] = [];
  for (const [dateKey, entries] of groups) {
    let label: string;
    if (dateKey === today) {
      label = 'Hoje';
    } else if (dateKey === yesterday) {
      label = 'Ontem';
    } else {
      label = format(new Date(dateKey + 'T12:00:00'), "d 'de' MMMM", { locale: ptBR });
    }
    result.push({ label, date: dateKey, entries });
  }

  return result;
}

function calcStats(journalItems: AtomItem[]) {
  const total = journalItems.length;
  const today = format(new Date(), 'yyyy-MM-dd');
  const withEmotion = journalItems.filter(
    (i) => getEmotionBefore(i) || getEmotionAfter(i)
  ).length;
  const todayCount = journalItems.filter(
    (i) => format(new Date(i.created_at), 'yyyy-MM-dd') === today
  ).length;
  return { total, withEmotion, todayCount };
}

// ─── Tests: filterJournalItems ───────────────────────────

describe('filterJournalItems', () => {
  it('includes type: log', () => {
    const items = [makeItem({ type: 'log' })];
    expect(filterJournalItems(items)).toHaveLength(1);
  });

  it('includes type: reflection', () => {
    const items = [makeItem({ type: 'reflection' })];
    expect(filterJournalItems(items)).toHaveLength(1);
  });

  it('excludes type: task', () => {
    const items = [makeItem({ type: 'task' })];
    expect(filterJournalItems(items)).toHaveLength(0);
  });

  it('excludes type: habit', () => {
    const items = [makeItem({ type: 'habit' })];
    expect(filterJournalItems(items)).toHaveLength(0);
  });

  it('excludes type: ritual', () => {
    const items = [makeItem({ type: 'ritual' })];
    expect(filterJournalItems(items)).toHaveLength(0);
  });

  it('excludes chore-tagged tasks', () => {
    const items = [makeItem({ type: 'task', tags: ['chore'] })];
    expect(filterJournalItems(items)).toHaveLength(0);
  });

  it('excludes archived items', () => {
    const items = [
      makeItem({ type: 'log', status: 'active' }),
      makeItem({ type: 'log', status: 'archived' }),
      makeItem({ type: 'reflection', status: 'archived' }),
    ];
    expect(filterJournalItems(items)).toHaveLength(1);
  });

  it('sorts newest first', () => {
    const older = makeItem({
      type: 'log',
      title: 'older',
      created_at: '2025-01-01T10:00:00Z',
    });
    const newer = makeItem({
      type: 'log',
      title: 'newer',
      created_at: '2025-06-15T10:00:00Z',
    });
    const result = filterJournalItems([older, newer]);
    expect(result[0].title).toBe('newer');
    expect(result[1].title).toBe('older');
  });

  it('handles mixed types correctly', () => {
    const items = [
      makeItem({ type: 'log' }),
      makeItem({ type: 'reflection' }),
      makeItem({ type: 'task' }),
      makeItem({ type: 'ritual' }),
      makeItem({ type: 'note' }),
      makeItem({ type: 'log', status: 'archived' }),
    ];
    expect(filterJournalItems(items)).toHaveLength(2);
  });
});

// ─── Tests: groupByDate ──────────────────────────────────

describe('groupByDate', () => {
  it('groups items by date', () => {
    const items = [
      makeItem({ type: 'log', created_at: '2025-06-15T02:00:00Z' }),
      makeItem({ type: 'log', created_at: '2025-06-15T06:00:00Z' }),
      makeItem({ type: 'log', created_at: '2025-06-14T02:00:00Z' }),
    ];
    const groups = groupByDate(items);
    expect(groups).toHaveLength(2);
  });

  it('labels today as "Hoje"', () => {
    const items = [makeItem({ type: 'log', created_at: new Date().toISOString() })];
    const groups = groupByDate(items);
    expect(groups[0].label).toBe('Hoje');
  });

  it('labels yesterday as "Ontem"', () => {
    const yesterday = subDays(new Date(), 1);
    const items = [makeItem({ type: 'log', created_at: yesterday.toISOString() })];
    const groups = groupByDate(items);
    expect(groups[0].label).toBe('Ontem');
  });

  it('labels older dates with "d de MMMM" format', () => {
    const items = [
      makeItem({ type: 'log', created_at: '2025-01-10T10:00:00Z' }),
    ];
    const groups = groupByDate(items);
    expect(groups[0].label).toBe('10 de janeiro');
  });

  it('returns empty array for no items', () => {
    expect(groupByDate([])).toHaveLength(0);
  });

  it('multiple items on same day are in same group', () => {
    const items = [
      makeItem({ type: 'log', title: 'A', created_at: '2025-03-01T01:00:00Z' }),
      makeItem({ type: 'log', title: 'B', created_at: '2025-03-01T05:00:00Z' }),
    ];
    const groups = groupByDate(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].entries).toHaveLength(2);
  });
});

// ─── Tests: calcStats ────────────────────────────────────

describe('calcStats', () => {
  it('counts total correctly', () => {
    const items = [
      makeItem({ type: 'log' }),
      makeItem({ type: 'log' }),
      makeItem({ type: 'reflection' }),
    ];
    expect(calcStats(items).total).toBe(3);
  });

  it('counts today items', () => {
    const items = [
      makeItem({ type: 'log', created_at: new Date().toISOString() }),
      makeItem({ type: 'log', created_at: '2025-01-01T10:00:00Z' }),
    ];
    expect(calcStats(items).todayCount).toBe(1);
  });

  it('counts items with emotion_before', () => {
    const items = [
      makeItem({ type: 'log', body: { soul: { emotion_before: 'calmo', emotion_after: null, energy_level: null, needs_checkin: false, ritual_slot: null } } }),
      makeItem({ type: 'log' }),
    ];
    expect(calcStats(items).withEmotion).toBe(1);
  });

  it('counts items with emotion_after', () => {
    const items = [
      makeItem({ type: 'log', body: { soul: { emotion_after: 'grato', emotion_before: null, energy_level: null, needs_checkin: false, ritual_slot: null } } }),
      makeItem({ type: 'log' }),
    ];
    expect(calcStats(items).withEmotion).toBe(1);
  });

  it('counts item with both emotions only once', () => {
    const items = [
      makeItem({ type: 'log', body: { soul: { emotion_before: 'ansioso', emotion_after: 'calmo', energy_level: null, needs_checkin: false, ritual_slot: null } } }),
    ];
    expect(calcStats(items).withEmotion).toBe(1);
  });

  it('returns zeros for empty array', () => {
    const stats = calcStats([]);
    expect(stats).toEqual({ total: 0, withEmotion: 0, todayCount: 0 });
  });
});
