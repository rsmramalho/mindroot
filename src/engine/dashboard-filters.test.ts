// engine/dashboard-filters.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  filterItems,
  sortItems,
  groupItems,
  getOverdueItems,
  getTodayItems,
  getFocusItems,
  getInboxItems,
  getChoreItems,
  MODULE_LABELS,
  MODULE_COLORS,
  PRIORITY_ORDER,
  PRIORITY_LABELS,
} from './dashboard-filters';
import { mockItem, resetIds, today, yesterday, twoDaysAgo, tomorrow, nextWeek } from '@/__test__/mock-factory';
import type { AtomItem, Priority } from '@/types/item';

beforeEach(() => resetIds());

// Helper to set due_date via body.operations
function withDueDate(dueDate: string | null) {
  return dueDate ? { body: { operations: { due_date: dueDate, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null } } } : {};
}

function withPriority(priority: Priority): Partial<AtomItem> {
  return { body: { operations: { priority, due_date: null, deadline: null, project_status: null, progress_mode: null, progress: null } } };
}

function withDueDateAndPriority(dueDate: string | null, priority: Priority | null): Partial<AtomItem> {
  return { body: { operations: { due_date: dueDate, priority, deadline: null, project_status: null, progress_mode: null, progress: null } } };
}

// ━━━ filterItems ━━━

describe('filterItems', () => {
  it('excludes completed items by default', () => {
    const items = [mockItem(), mockItem({ status: 'completed' })];
    const result = filterItems(items, {});
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('active');
  });

  it('includes completed items when showCompleted is true', () => {
    const items = [mockItem(), mockItem({ status: 'completed' })];
    const result = filterItems(items, { showCompleted: true });
    expect(result).toHaveLength(2);
  });

  it('excludes archived items by default', () => {
    const items = [mockItem(), mockItem({ status: 'archived' })];
    const result = filterItems(items, {});
    expect(result).toHaveLength(1);
  });

  it('includes archived items when showArchived is true', () => {
    const items = [mockItem(), mockItem({ status: 'archived' })];
    const result = filterItems(items, { showArchived: true });
    expect(result).toHaveLength(2);
  });

  it('filters by module', () => {
    const items = [
      mockItem({ module: 'work' }),
      mockItem({ module: 'family' }),
      mockItem({ module: null }),
    ];
    const result = filterItems(items, { module: 'work' });
    expect(result).toHaveLength(1);
    expect(result[0].module).toBe('work');
  });

  it('filters by priority', () => {
    const items = [
      mockItem(withPriority('high')),
      mockItem(withPriority('low')),
    ];
    const result = filterItems(items, { priority: 'high' });
    expect(result).toHaveLength(1);
  });

  it('filters by type', () => {
    const items = [
      mockItem({ type: 'task' }),
      mockItem({ type: 'habit' }),
      mockItem({ type: 'task', tags: ['chore'] }),
    ];
    const result = filterItems(items, { type: 'task' });
    expect(result).toHaveLength(2);
  });

  it('filters dateRange=today', () => {
    const items = [
      mockItem(withDueDate(today())),
      mockItem(withDueDate(tomorrow())),
      mockItem(),
    ];
    const result = filterItems(items, { dateRange: 'today' });
    expect(result).toHaveLength(1);
  });

  it('filters dateRange=overdue (past but not today)', () => {
    const items = [
      mockItem(withDueDate(twoDaysAgo())),
      mockItem(withDueDate(today())),
      mockItem(withDueDate(tomorrow())),
    ];
    const result = filterItems(items, { dateRange: 'overdue' });
    expect(result).toHaveLength(1);
  });

  it('filters dateRange=future', () => {
    const items = [
      mockItem(withDueDate(twoDaysAgo())),
      mockItem(withDueDate(tomorrow())),
    ];
    const result = filterItems(items, { dateRange: 'future' });
    expect(result).toHaveLength(1);
  });

  it('dateRange=all returns everything', () => {
    const items = [
      mockItem(withDueDate(twoDaysAgo())),
      mockItem(withDueDate(today())),
      mockItem(withDueDate(tomorrow())),
      mockItem(),
    ];
    const result = filterItems(items, { dateRange: 'all' });
    expect(result).toHaveLength(4);
  });

  it('filters by search in title', () => {
    const items = [
      mockItem({ title: 'Buy milk' }),
      mockItem({ title: 'Read book' }),
    ];
    const result = filterItems(items, { search: 'milk' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Buy milk');
  });

  it('filters by search in tags', () => {
    const items = [
      mockItem({ title: 'Task A', tags: ['frontend'] }),
      mockItem({ title: 'Task B', tags: ['backend'] }),
    ];
    const result = filterItems(items, { search: 'front' });
    expect(result).toHaveLength(1);
  });

  it('search is case insensitive', () => {
    const items = [mockItem({ title: 'Deploy to Production' })];
    const result = filterItems(items, { search: 'DEPLOY' });
    expect(result).toHaveLength(1);
  });

  it('combines multiple filters', () => {
    const items = [
      mockItem({ module: 'work', title: 'Fix bug', ...withPriority('high') }),
      mockItem({ module: 'work', title: 'Refactor', ...withPriority('low') }),
      mockItem({ module: 'family', title: 'Dinner', ...withPriority('high') }),
    ];
    const result = filterItems(items, { module: 'work', priority: 'high' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Fix bug');
  });
});

// ━━━ sortItems ━━━

describe('sortItems', () => {
  it('sorts by due_date ascending (nulls last)', () => {
    const items = [
      mockItem({ title: 'C', ...withDueDate(tomorrow()) }),
      mockItem({ title: 'A', ...withDueDate(yesterday()) }),
      mockItem({ title: 'B' }),
    ];
    const result = sortItems(items, 'due_date', 'asc');
    expect(result.map((i) => i.title)).toEqual(['A', 'C', 'B']);
  });

  it('sorts by due_date descending', () => {
    const items = [
      mockItem({ title: 'A', ...withDueDate(yesterday()) }),
      mockItem({ title: 'C', ...withDueDate(tomorrow()) }),
    ];
    const result = sortItems(items, 'due_date', 'desc');
    expect(result.map((i) => i.title)).toEqual(['C', 'A']);
  });

  it('sorts by priority order', () => {
    const items = [
      mockItem({ title: 'F', ...withPriority('low') }),
      mockItem({ title: 'U', ...withPriority('high') }),
      mockItem({ title: 'I', ...withPriority('medium') }),
      mockItem({ title: 'N' }),
    ];
    const result = sortItems(items, 'priority', 'asc');
    expect(result.map((i) => i.title)).toEqual(['U', 'I', 'F', 'N']);
  });

  it('sorts by created_at', () => {
    const items = [
      mockItem({ title: 'B', created_at: '2025-06-02T00:00:00Z' }),
      mockItem({ title: 'A', created_at: '2025-06-01T00:00:00Z' }),
    ];
    const result = sortItems(items, 'created_at', 'asc');
    expect(result.map((i) => i.title)).toEqual(['A', 'B']);
  });

  it('sorts by module alphabetically', () => {
    const items = [
      mockItem({ title: 'W', module: 'work' }),
      mockItem({ title: 'B', module: 'body' }),
      mockItem({ title: 'N', module: null }),
    ];
    const result = sortItems(items, 'module', 'asc');
    expect(result.map((i) => i.title)).toEqual(['B', 'W', 'N']);
  });

  it('does not mutate original array', () => {
    const items = [
      mockItem(withDueDate(tomorrow())),
      mockItem(withDueDate(yesterday())),
    ];
    const original = [...items];
    sortItems(items, 'due_date');
    expect(items[0].id).toBe(original[0].id);
  });
});

// ━━━ groupItems ━━━

describe('groupItems', () => {
  it('returns single group for groupBy=none', () => {
    const items = [mockItem(), mockItem()];
    const groups = groupItems(items, 'none');
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('all');
    expect(groups[0].items).toHaveLength(2);
  });

  it('groups by module', () => {
    const items = [
      mockItem({ module: 'work' }),
      mockItem({ module: 'work' }),
      mockItem({ module: 'family' }),
      mockItem({ module: null }),
    ];
    const groups = groupItems(items, 'module');
    expect(groups.length).toBeGreaterThanOrEqual(2);

    const workGroup = groups.find((g) => g.key === 'work');
    expect(workGroup?.items).toHaveLength(2);
    expect(workGroup?.label).toBe('Trabalho');
    expect(workGroup?.color).toBe('#8a9e7a');
  });

  it('groups by priority', () => {
    const items = [
      mockItem(withPriority('high')),
      mockItem(withPriority('high')),
      mockItem(withPriority('low')),
    ];
    const groups = groupItems(items, 'priority');
    const highGroup = groups.find((g) => g.key === 'high');
    expect(highGroup?.items).toHaveLength(2);
    expect(highGroup?.label).toBe('Alta');
  });

  it('groups by type', () => {
    const items = [
      mockItem({ type: 'task' }),
      mockItem({ type: 'habit' }),
      mockItem({ type: 'task' }),
    ];
    const groups = groupItems(items, 'type');
    const taskGroup = groups.find((g) => g.key === 'task');
    expect(taskGroup?.items).toHaveLength(2);
    expect(taskGroup?.label).toBe('Task');
  });

  it('groups by date with correct labels', () => {
    const items = [
      mockItem(withDueDate(twoDaysAgo())),
      mockItem(withDueDate(today())),
      mockItem(withDueDate(nextWeek())),
      mockItem(),
    ];
    const groups = groupItems(items, 'date');
    const labels = groups.map((g) => g.label);
    expect(labels).toContain('Atrasado');
    expect(labels).toContain('Hoje');
    expect(labels).toContain('Sem data');
  });

  it('module groups have colors, non-module groups do not', () => {
    const items = [mockItem({ module: 'mind' })];
    const moduleGroups = groupItems(items, 'module');
    expect(moduleGroups[0].color).toBe('#a89478');

    const priorityGroups = groupItems([mockItem(withPriority('high'))], 'priority');
    expect(priorityGroups[0].color).toBeUndefined();
  });
});

// ━━━ Derived Lists ━━━

describe('getOverdueItems', () => {
  it('returns items with past due_date (not today)', () => {
    const items = [
      mockItem(withDueDate(twoDaysAgo())),
      mockItem(withDueDate(today())),
      mockItem(withDueDate(tomorrow())),
      mockItem(),
    ];
    const overdue = getOverdueItems(items);
    expect(overdue).toHaveLength(1);
  });

  it('excludes completed and archived items', () => {
    const items = [
      mockItem({ status: 'completed', ...withDueDate(twoDaysAgo()) }),
      mockItem({ status: 'archived', ...withDueDate(twoDaysAgo()) }),
      mockItem(withDueDate(twoDaysAgo())),
    ];
    const overdue = getOverdueItems(items);
    expect(overdue).toHaveLength(1);
  });
});

describe('getTodayItems', () => {
  it('returns only items due today', () => {
    const items = [
      mockItem(withDueDate(today())),
      mockItem(withDueDate(yesterday())),
      mockItem(withDueDate(tomorrow())),
    ];
    expect(getTodayItems(items)).toHaveLength(1);
  });

  it('excludes completed/archived', () => {
    const items = [
      mockItem({ status: 'completed', ...withDueDate(today()) }),
      mockItem(withDueDate(today())),
    ];
    expect(getTodayItems(items)).toHaveLength(1);
  });
});

describe('getFocusItems', () => {
  it('returns high priority items', () => {
    const items = [
      mockItem(withPriority('high')),
      mockItem(withPriority('medium')),
      mockItem(withPriority('low')),
      mockItem(),
    ];
    expect(getFocusItems(items)).toHaveLength(1);
  });

  it('excludes completed/archived', () => {
    const items = [
      mockItem({ status: 'completed', ...withPriority('high') }),
      mockItem(withPriority('high')),
    ];
    expect(getFocusItems(items)).toHaveLength(1);
  });
});

describe('getInboxItems', () => {
  it('returns items without module', () => {
    const items = [
      mockItem({ module: null }),
      mockItem({ module: 'work' }),
    ];
    expect(getInboxItems(items)).toHaveLength(1);
  });
});

describe('getChoreItems', () => {
  it('returns items with chore tag', () => {
    const items = [
      mockItem({ tags: ['chore'] }),
      mockItem({ tags: [] }),
    ];
    expect(getChoreItems(items)).toHaveLength(1);
  });
});

// ━━━ Constants ━━━

describe('constants', () => {
  it('MODULE_LABELS has all 8 modules', () => {
    expect(Object.keys(MODULE_LABELS)).toHaveLength(8);
    expect(MODULE_LABELS.work).toBe('Trabalho');
  });

  it('MODULE_COLORS has same keys as MODULE_LABELS', () => {
    for (const key of Object.keys(MODULE_LABELS)) {
      expect(MODULE_COLORS[key]).toBeDefined();
    }
  });

  it('PRIORITY_ORDER has correct ranking', () => {
    expect(PRIORITY_ORDER.high).toBeLessThan(PRIORITY_ORDER.medium);
    expect(PRIORITY_ORDER.medium).toBeLessThan(PRIORITY_ORDER.low);
  });

  it('PRIORITY_LABELS covers all 3 levels', () => {
    expect(Object.keys(PRIORITY_LABELS)).toHaveLength(3);
  });
});
