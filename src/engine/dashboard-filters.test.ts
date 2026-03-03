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

beforeEach(() => resetIds());

// ━━━ filterItems ━━━

describe('filterItems', () => {
  it('excludes completed items by default', () => {
    const items = [mockItem(), mockItem({ completed: true })];
    const result = filterItems(items, {});
    expect(result).toHaveLength(1);
    expect(result[0].completed).toBe(false);
  });

  it('includes completed items when showCompleted is true', () => {
    const items = [mockItem(), mockItem({ completed: true })];
    const result = filterItems(items, { showCompleted: true });
    expect(result).toHaveLength(2);
  });

  it('excludes archived items by default', () => {
    const items = [mockItem(), mockItem({ archived: true })];
    const result = filterItems(items, {});
    expect(result).toHaveLength(1);
  });

  it('includes archived items when showArchived is true', () => {
    const items = [mockItem(), mockItem({ archived: true })];
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
      mockItem({ priority: 'urgente' }),
      mockItem({ priority: 'futuro' }),
    ];
    const result = filterItems(items, { priority: 'urgente' });
    expect(result).toHaveLength(1);
    expect(result[0].priority).toBe('urgente');
  });

  it('filters by type', () => {
    const items = [
      mockItem({ type: 'task' }),
      mockItem({ type: 'habit' }),
      mockItem({ type: 'chore' }),
    ];
    const result = filterItems(items, { type: 'task' });
    expect(result).toHaveLength(1);
  });

  it('filters dateRange=today', () => {
    const items = [
      mockItem({ due_date: today() }),
      mockItem({ due_date: tomorrow() }),
      mockItem({ due_date: null }),
    ];
    const result = filterItems(items, { dateRange: 'today' });
    expect(result).toHaveLength(1);
    expect(result[0].due_date).toBe(today());
  });

  it('filters dateRange=overdue (past but not today)', () => {
    const items = [
      mockItem({ due_date: twoDaysAgo() }),
      mockItem({ due_date: today() }),
      mockItem({ due_date: tomorrow() }),
    ];
    const result = filterItems(items, { dateRange: 'overdue' });
    expect(result).toHaveLength(1);
    expect(result[0].due_date).toBe(twoDaysAgo());
  });

  it('filters dateRange=future', () => {
    const items = [
      mockItem({ due_date: twoDaysAgo() }),
      mockItem({ due_date: tomorrow() }),
    ];
    const result = filterItems(items, { dateRange: 'future' });
    expect(result).toHaveLength(1);
    expect(result[0].due_date).toBe(tomorrow());
  });

  it('dateRange=all returns everything', () => {
    const items = [
      mockItem({ due_date: twoDaysAgo() }),
      mockItem({ due_date: today() }),
      mockItem({ due_date: tomorrow() }),
      mockItem({ due_date: null }),
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
      mockItem({ module: 'work', priority: 'urgente', title: 'Fix bug' }),
      mockItem({ module: 'work', priority: 'futuro', title: 'Refactor' }),
      mockItem({ module: 'family', priority: 'urgente', title: 'Dinner' }),
    ];
    const result = filterItems(items, { module: 'work', priority: 'urgente' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Fix bug');
  });
});

// ━━━ sortItems ━━━

describe('sortItems', () => {
  it('sorts by due_date ascending (nulls last)', () => {
    const items = [
      mockItem({ title: 'C', due_date: tomorrow() }),
      mockItem({ title: 'A', due_date: yesterday() }),
      mockItem({ title: 'B', due_date: null }),
    ];
    const result = sortItems(items, 'due_date', 'asc');
    expect(result.map((i) => i.title)).toEqual(['A', 'C', 'B']);
  });

  it('sorts by due_date descending', () => {
    const items = [
      mockItem({ title: 'A', due_date: yesterday() }),
      mockItem({ title: 'C', due_date: tomorrow() }),
    ];
    const result = sortItems(items, 'due_date', 'desc');
    expect(result.map((i) => i.title)).toEqual(['C', 'A']);
  });

  it('sorts by priority order', () => {
    const items = [
      mockItem({ title: 'F', priority: 'futuro' }),
      mockItem({ title: 'U', priority: 'urgente' }),
      mockItem({ title: 'I', priority: 'importante' }),
      mockItem({ title: 'N', priority: null }),
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
      mockItem({ due_date: tomorrow() }),
      mockItem({ due_date: yesterday() }),
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
      mockItem({ priority: 'urgente' }),
      mockItem({ priority: 'urgente' }),
      mockItem({ priority: 'futuro' }),
    ];
    const groups = groupItems(items, 'priority');
    const urgenteGroup = groups.find((g) => g.key === 'urgente');
    expect(urgenteGroup?.items).toHaveLength(2);
    expect(urgenteGroup?.label).toBe('Urgente');
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
      mockItem({ due_date: twoDaysAgo() }),
      mockItem({ due_date: today() }),
      mockItem({ due_date: nextWeek() }),
      mockItem({ due_date: null }),
    ];
    const groups = groupItems(items, 'date');
    const labels = groups.map((g) => g.label);
    expect(labels).toContain('Atrasado');
    expect(labels).toContain('Hoje');
    expect(labels).toContain('Sem data');
  });

  it('module groups have colors, non-module groups do not', () => {
    const items = [mockItem({ module: 'soul' })];
    const moduleGroups = groupItems(items, 'module');
    expect(moduleGroups[0].color).toBe('#8a6e5a');

    const priorityGroups = groupItems([mockItem({ priority: 'urgente' })], 'priority');
    expect(priorityGroups[0].color).toBeUndefined();
  });
});

// ━━━ Derived Lists ━━━

describe('getOverdueItems', () => {
  it('returns items with past due_date (not today)', () => {
    const items = [
      mockItem({ due_date: twoDaysAgo() }),
      mockItem({ due_date: today() }),
      mockItem({ due_date: tomorrow() }),
      mockItem({ due_date: null }),
    ];
    const overdue = getOverdueItems(items);
    expect(overdue).toHaveLength(1);
    expect(overdue[0].due_date).toBe(twoDaysAgo());
  });

  it('excludes completed and archived items', () => {
    const items = [
      mockItem({ due_date: twoDaysAgo(), completed: true }),
      mockItem({ due_date: twoDaysAgo(), archived: true }),
      mockItem({ due_date: twoDaysAgo() }),
    ];
    const overdue = getOverdueItems(items);
    expect(overdue).toHaveLength(1);
  });
});

describe('getTodayItems', () => {
  it('returns only items due today', () => {
    const items = [
      mockItem({ due_date: today() }),
      mockItem({ due_date: yesterday() }),
      mockItem({ due_date: tomorrow() }),
    ];
    expect(getTodayItems(items)).toHaveLength(1);
  });

  it('excludes completed/archived', () => {
    const items = [
      mockItem({ due_date: today(), completed: true }),
      mockItem({ due_date: today() }),
    ];
    expect(getTodayItems(items)).toHaveLength(1);
  });
});

describe('getFocusItems', () => {
  it('returns urgente and importante items', () => {
    const items = [
      mockItem({ priority: 'urgente' }),
      mockItem({ priority: 'importante' }),
      mockItem({ priority: 'manutencao' }),
      mockItem({ priority: 'futuro' }),
      mockItem({ priority: null }),
    ];
    expect(getFocusItems(items)).toHaveLength(2);
  });

  it('excludes completed/archived', () => {
    const items = [
      mockItem({ priority: 'urgente', completed: true }),
      mockItem({ priority: 'urgente' }),
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
  it('returns items with is_chore=true', () => {
    const items = [
      mockItem({ is_chore: true }),
      mockItem({ is_chore: false }),
    ];
    expect(getChoreItems(items)).toHaveLength(1);
  });
});

// ━━━ Constants ━━━

describe('constants', () => {
  it('MODULE_LABELS has all 7 modules', () => {
    expect(Object.keys(MODULE_LABELS)).toHaveLength(7);
    expect(MODULE_LABELS.work).toBe('Trabalho');
    expect(MODULE_LABELS.soul).toBe('Alma');
  });

  it('MODULE_COLORS has same keys as MODULE_LABELS', () => {
    for (const key of Object.keys(MODULE_LABELS)) {
      expect(MODULE_COLORS[key]).toBeDefined();
    }
  });

  it('PRIORITY_ORDER has correct ranking', () => {
    expect(PRIORITY_ORDER.urgente).toBeLessThan(PRIORITY_ORDER.importante);
    expect(PRIORITY_ORDER.importante).toBeLessThan(PRIORITY_ORDER.manutencao);
    expect(PRIORITY_ORDER.manutencao).toBeLessThan(PRIORITY_ORDER.futuro);
  });

  it('PRIORITY_LABELS covers all 4 levels', () => {
    expect(Object.keys(PRIORITY_LABELS)).toHaveLength(4);
  });
});
