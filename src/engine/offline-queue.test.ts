// engine/offline-queue.test.ts — Unit tests for offline queue engine
import { describe, it, expect, beforeEach } from 'vitest';
import { compactQueue, shouldOverwrite } from './offline-queue';
import type { QueueEntry } from './offline-queue';

// ─── Helpers ────────────────────────────────────────────────

let idCounter = 0;
function makeEntry(
  overrides: Partial<QueueEntry> & Pick<QueueEntry, 'action'>,
): QueueEntry {
  idCounter++;
  return {
    id: overrides.id ?? idCounter,
    action: overrides.action,
    itemId: overrides.itemId ?? `item-${idCounter}`,
    payload: overrides.payload ?? {},
    timestamp: overrides.timestamp ?? new Date(2026, 2, 9, 10, 0, idCounter).toISOString(),
    retries: overrides.retries ?? 0,
  };
}

beforeEach(() => { idCounter = 0; });

// ─── shouldOverwrite ────────────────────────────────────────

describe('shouldOverwrite', () => {
  it('returns true when server has no updated_at', () => {
    expect(shouldOverwrite('2026-03-09T10:00:00Z', null)).toBe(true);
  });

  it('returns true when queue timestamp >= server', () => {
    expect(shouldOverwrite('2026-03-09T10:00:01Z', '2026-03-09T10:00:00Z')).toBe(true);
  });

  it('returns true when timestamps are equal', () => {
    expect(shouldOverwrite('2026-03-09T10:00:00Z', '2026-03-09T10:00:00Z')).toBe(true);
  });

  it('returns false when queue timestamp < server', () => {
    expect(shouldOverwrite('2026-03-09T09:00:00Z', '2026-03-09T10:00:00Z')).toBe(false);
  });
});

// ─── compactQueue ───────────────────────────────────────────

describe('compactQueue', () => {
  it('returns empty array for empty input', () => {
    expect(compactQueue([])).toEqual([]);
  });

  it('passes through single entries unchanged', () => {
    const entry = makeEntry({ action: 'create', itemId: null });
    const result = compactQueue([entry]);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('create');
  });

  it('merges multiple updates on same item into one', () => {
    const t1 = '2026-03-09T10:00:00Z';
    const t2 = '2026-03-09T10:01:00Z';
    const entries: QueueEntry[] = [
      makeEntry({ action: 'update', itemId: 'item-1', payload: { title: 'A' }, timestamp: t1 }),
      makeEntry({ action: 'update', itemId: 'item-1', payload: { module: 'work' }, timestamp: t2 }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(1);
    expect(result[0].payload).toEqual({ title: 'A', module: 'work' });
    expect(result[0].timestamp).toBe(t2);
  });

  it('keeps only delete when item is updated then deleted', () => {
    const entries: QueueEntry[] = [
      makeEntry({ action: 'update', itemId: 'item-1', payload: { title: 'A' } }),
      makeEntry({ action: 'delete', itemId: 'item-1' }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('delete');
  });

  it('does not mix different items', () => {
    const entries: QueueEntry[] = [
      makeEntry({ action: 'update', itemId: 'item-1', payload: { title: 'A' } }),
      makeEntry({ action: 'update', itemId: 'item-2', payload: { title: 'B' } }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(2);
  });

  it('merges complete + update on same item', () => {
    const entries: QueueEntry[] = [
      makeEntry({ action: 'complete', itemId: 'item-1', payload: {} }),
      makeEntry({ action: 'update', itemId: 'item-1', payload: { emotion_after: 'grato' } }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(1);
    expect(result[0].payload).toEqual({ emotion_after: 'grato' });
  });

  it('preserves order by timestamp after compaction', () => {
    const t1 = '2026-03-09T10:00:00Z';
    const t2 = '2026-03-09T10:01:00Z';
    const t3 = '2026-03-09T10:02:00Z';
    const entries: QueueEntry[] = [
      makeEntry({ action: 'update', itemId: 'item-2', payload: { title: 'B' }, timestamp: t2 }),
      makeEntry({ action: 'update', itemId: 'item-1', payload: { title: 'A' }, timestamp: t1 }),
      makeEntry({ action: 'update', itemId: 'item-3', payload: { title: 'C' }, timestamp: t3 }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(3);
    expect(result[0].itemId).toBe('item-1');
    expect(result[1].itemId).toBe('item-2');
    expect(result[2].itemId).toBe('item-3');
  });

  it('later update overwrites earlier payload fields', () => {
    const entries: QueueEntry[] = [
      makeEntry({ action: 'update', itemId: 'item-1', payload: { title: 'Old', module: 'work' }, timestamp: '2026-03-09T10:00:00Z' }),
      makeEntry({ action: 'update', itemId: 'item-1', payload: { title: 'New' }, timestamp: '2026-03-09T10:01:00Z' }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(1);
    expect(result[0].payload).toEqual({ title: 'New', module: 'work' });
  });

  it('handles create entries (null itemId) independently', () => {
    const entries: QueueEntry[] = [
      makeEntry({ action: 'create', itemId: null, payload: { title: 'A' } }),
      makeEntry({ action: 'create', itemId: null, payload: { title: 'B' } }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(2);
  });
});

// ─── QueueEntry shape ───────────────────────────────────────

describe('QueueEntry shape', () => {
  it('has expected fields', () => {
    const entry = makeEntry({ action: 'update', itemId: 'x', payload: { title: 'test' } });
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('action', 'update');
    expect(entry).toHaveProperty('itemId', 'x');
    expect(entry).toHaveProperty('payload');
    expect(entry).toHaveProperty('timestamp');
    expect(entry).toHaveProperty('retries', 0);
  });

  it('defaults retries to 0', () => {
    const entry = makeEntry({ action: 'create' });
    expect(entry.retries).toBe(0);
  });
});
