// engine/search.test.ts — Search & filter engine tests
import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalize,
  parseSearchQuery,
  searchItems,
  hasActiveFilters,
  getFilterLabels,
  extractTags,
  EMPTY_FILTERS,
} from './search';
import { mockItem, resetIds, today, tomorrow, twoDaysAgo } from '@/__test__/mock-factory';
import type { AtomItem, Priority, RitualSlot } from '@/types/item';

beforeEach(() => resetIds());

// Helpers for v2 body fields
function withDueDate(dueDate: string) {
  return { body: { operations: { due_date: dueDate, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null } } };
}

function withEmotionBefore(emotion: string) {
  return { body: { soul: { emotion_before: emotion, emotion_after: null, energy_level: null, needs_checkin: false, ritual_slot: null } } };
}

function withEmotionAfter(emotion: string) {
  return { body: { soul: { emotion_after: emotion, emotion_before: null, energy_level: null, needs_checkin: false, ritual_slot: null } } };
}

function withRitualSlot(slot: RitualSlot): Partial<AtomItem> {
  return { body: { soul: { ritual_slot: slot, emotion_before: null, emotion_after: null, energy_level: null, needs_checkin: false } } };
}

function withPriority(priority: Priority): Partial<AtomItem> {
  return { body: { operations: { priority, due_date: null, deadline: null, project_status: null, progress_mode: null, progress: null } } };
}

// ━━━ normalize ━━━

describe('normalize', () => {
  it('lowercases and strips accents', () => {
    expect(normalize('Propósito')).toBe('proposito');
    expect(normalize('Família')).toBe('familia');
    expect(normalize('Zênite')).toBe('zenite');
  });

  it('handles already-normalized strings', () => {
    expect(normalize('work')).toBe('work');
  });
});

// ━━━ parseSearchQuery ━━━

describe('parseSearchQuery', () => {
  it('parses module prefix', () => {
    const f = parseSearchQuery('mod:work');
    expect(f.module).toBe('work');
    expect(f.text).toBe('');
  });

  it('parses module by label (pt-BR)', () => {
    const f = parseSearchQuery('mod:trabalho');
    expect(f.module).toBe('work');
  });

  it('parses emotion prefix', () => {
    const f = parseSearchQuery('emo:calmo');
    expect(f.emotion).toBe('calmo');
  });

  it('parses period prefix', () => {
    const f = parseSearchQuery('per:aurora');
    expect(f.period).toBe('aurora');
  });

  it('parses period by label', () => {
    const f = parseSearchQuery('per:zenite');
    expect(f.period).toBe('zenite');
  });

  it('parses priority prefix', () => {
    const f = parseSearchQuery('prio:high');
    expect(f.priority).toBe('high');
  });

  it('parses type prefix (pt-BR alias)', () => {
    const f = parseSearchQuery('tipo:tarefa');
    expect(f.type).toBe('task');
  });

  it('parses tag prefix', () => {
    const f = parseSearchQuery('tag:frontend');
    expect(f.tag).toBe('frontend');
  });

  it('parses date prefix', () => {
    const f = parseSearchQuery('data:hoje');
    expect(f.dateRange).toBe('hoje');
  });

  it('parses date in English', () => {
    const f = parseSearchQuery('date:overdue');
    expect(f.dateRange).toBe('atrasado');
  });

  it('extracts free text alongside filters', () => {
    const f = parseSearchQuery('mod:work comprar leite');
    expect(f.module).toBe('work');
    expect(f.text).toBe('comprar leite');
  });

  it('combines multiple filters', () => {
    const f = parseSearchQuery('mod:family emo:grato prio:medium festa');
    expect(f.module).toBe('family');
    expect(f.emotion).toBe('grato');
    expect(f.priority).toBe('medium');
    expect(f.text).toBe('festa');
  });

  it('treats unknown prefixes as text', () => {
    const f = parseSearchQuery('foo:bar baz');
    expect(f.text).toBe('foo:bar baz');
  });

  it('handles empty query', () => {
    const f = parseSearchQuery('');
    expect(f).toEqual(EMPTY_FILTERS);
  });
});

// ━━━ searchItems ━━━

describe('searchItems', () => {
  it('finds items by title text', () => {
    const items = [
      mockItem({ title: 'Comprar leite' }),
      mockItem({ title: 'Estudar React' }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, text: 'leite' });
    expect(results).toHaveLength(1);
    expect(results[0].item.title).toBe('Comprar leite');
    expect(results[0].matchField).toBe('title');
  });

  it('finds items by notes', () => {
    const items = [
      mockItem({ title: 'Task A', notes: 'preciso comprar no mercado' }),
      mockItem({ title: 'Task B', notes: null }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, text: 'mercado' });
    expect(results).toHaveLength(1);
    expect(results[0].matchField).toBe('notes');
  });

  it('finds items by tag', () => {
    const items = [
      mockItem({ title: 'Deploy', tags: ['devops', 'ci'] }),
      mockItem({ title: 'Design', tags: ['ui'] }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, text: 'devops' });
    expect(results).toHaveLength(1);
    expect(results[0].matchField).toBe('tag');
  });

  it('title match scores higher than notes', () => {
    const items = [
      mockItem({ title: 'Other', notes: 'leite stuff' }),
      mockItem({ title: 'Comprar leite' }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, text: 'leite' });
    expect(results[0].item.title).toBe('Comprar leite');
  });

  it('title-start match scores higher than title-contains', () => {
    const items = [
      mockItem({ title: 'Buy leite today' }),
      mockItem({ title: 'leite fresco' }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, text: 'leite' });
    expect(results[0].item.title).toBe('leite fresco');
  });

  it('filters by module', () => {
    const items = [
      mockItem({ title: 'A', module: 'work' }),
      mockItem({ title: 'B', module: 'family' }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, module: 'work' });
    expect(results).toHaveLength(1);
    expect(results[0].item.module).toBe('work');
  });

  it('filters by emotion (before or after)', () => {
    const items = [
      mockItem({ title: 'A', ...withEmotionBefore('calmo') }),
      mockItem({ title: 'B', ...withEmotionAfter('calmo') }),
      mockItem({ title: 'C', ...withEmotionBefore('ansioso') }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, emotion: 'calmo' });
    expect(results).toHaveLength(2);
  });

  it('filters by ritual period', () => {
    const items = [
      mockItem({ title: 'A', ...withRitualSlot('aurora') }),
      mockItem({ title: 'B', ...withRitualSlot('zenite') }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, period: 'aurora' });
    expect(results).toHaveLength(1);
  });

  it('filters by priority', () => {
    const items = [
      mockItem({ title: 'A', ...withPriority('high') }),
      mockItem({ title: 'B', ...withPriority('low') }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, priority: 'high' });
    expect(results).toHaveLength(1);
  });

  it('filters by type', () => {
    const items = [
      mockItem({ title: 'A', type: 'task' }),
      mockItem({ title: 'B', type: 'habit' }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, type: 'task' });
    expect(results).toHaveLength(1);
  });

  it('filters by tag prefix', () => {
    const items = [
      mockItem({ title: 'A', tags: ['frontend', 'react'] }),
      mockItem({ title: 'B', tags: ['backend'] }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, tag: 'front' });
    expect(results).toHaveLength(1);
  });

  it('filters by dateRange hoje', () => {
    const items = [
      mockItem({ title: 'A', ...withDueDate(today()) }),
      mockItem({ title: 'B', ...withDueDate(tomorrow()) }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, dateRange: 'hoje' });
    expect(results).toHaveLength(1);
  });

  it('filters by dateRange atrasado', () => {
    const items = [
      mockItem({ title: 'A', ...withDueDate(twoDaysAgo()) }),
      mockItem({ title: 'B', ...withDueDate(today()) }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, dateRange: 'atrasado' });
    expect(results).toHaveLength(1);
  });

  it('filters by dateRange futuro', () => {
    const items = [
      mockItem({ title: 'A', ...withDueDate(tomorrow()) }),
      mockItem({ title: 'B', ...withDueDate(twoDaysAgo()) }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, dateRange: 'futuro' });
    expect(results).toHaveLength(1);
  });

  it('excludes archived items', () => {
    const items = [
      mockItem({ title: 'A', status: 'archived' }),
      mockItem({ title: 'B' }),
    ];
    const results = searchItems(items, EMPTY_FILTERS);
    expect(results).toHaveLength(1);
  });

  it('filters completed when completed=false', () => {
    const items = [
      mockItem({ title: 'A', status: 'completed' }),
      mockItem({ title: 'B', status: 'active' }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, completed: false });
    expect(results).toHaveLength(1);
    expect(results[0].item.title).toBe('B');
  });

  it('combines text + filters', () => {
    const items = [
      mockItem({ title: 'Comprar leite', module: 'family' }),
      mockItem({ title: 'Comprar cafe', module: 'work' }),
      mockItem({ title: 'Estudar', module: 'family' }),
    ];
    const results = searchItems(items, { ...EMPTY_FILTERS, text: 'comprar', module: 'family' });
    expect(results).toHaveLength(1);
    expect(results[0].item.title).toBe('Comprar leite');
  });

  it('search is accent-insensitive', () => {
    const items = [mockItem({ title: 'Reflexão profunda' })];
    const results = searchItems(items, { ...EMPTY_FILTERS, text: 'reflexao' });
    expect(results).toHaveLength(1);
  });

  it('returns max results in score order', () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      mockItem({ title: `item ${i}` })
    );
    const results = searchItems(items, EMPTY_FILTERS);
    expect(results).toHaveLength(20); // no text filter = all match
  });
});

// ━━━ hasActiveFilters ━━━

describe('hasActiveFilters', () => {
  it('returns false for empty filters', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it('returns true when module is set', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, module: 'work' })).toBe(true);
  });

  it('returns true when emotion is set', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, emotion: 'calmo' })).toBe(true);
  });

  it('returns true when tag is set', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, tag: 'test' })).toBe(true);
  });
});

// ━━━ getFilterLabels ━━━

describe('getFilterLabels', () => {
  it('returns empty for no filters', () => {
    expect(getFilterLabels(EMPTY_FILTERS)).toEqual([]);
  });

  it('returns module label', () => {
    const labels = getFilterLabels({ ...EMPTY_FILTERS, module: 'work' });
    expect(labels).toHaveLength(1);
    expect(labels[0].label).toBe('Trabalho');
  });

  it('returns multiple labels', () => {
    const labels = getFilterLabels({
      ...EMPTY_FILTERS,
      module: 'family',
      emotion: 'grato',
      period: 'aurora',
    });
    expect(labels).toHaveLength(3);
  });
});

// ━━━ extractTags ━━━

describe('extractTags', () => {
  it('extracts unique tags sorted', () => {
    const items = [
      mockItem({ tags: ['b', 'a'] }),
      mockItem({ tags: ['a', 'c'] }),
    ];
    expect(extractTags(items)).toEqual(['a', 'b', 'c']);
  });

  it('returns empty for no tags', () => {
    expect(extractTags([mockItem()])).toEqual([]);
  });
});
