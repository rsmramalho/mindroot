// service/item-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ━━━ Mock offline store (always online in these tests) ━━━
vi.mock('@/store/offline-store', () => ({
  useOfflineStore: {
    getState: () => ({ isOnline: true, pendingCount: 0, setPendingCount: vi.fn() }),
  },
}));

vi.mock('@/engine/offline-queue', () => ({
  enqueue: vi.fn(),
}));

import { itemService } from './item-service';

// ━━━ Mock Supabase ━━━

const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: vi.fn(() => ({ select: mockSelect })) }));
const mockDeleteEq = vi.fn();
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));
const mockEq = vi.fn();
const mockOrder = vi.fn();

// Build chaining mock
function buildFrom() {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  // Default resolve
  chain.then = undefined;
  return chain;
}

let mockChain: any;

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      return mockChain;
    }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockChain = buildFrom();
});

// Helper to set chain resolution
function resolveChain(data: any, error: any = null) {
  // For list: .from().select().eq().eq().order()
  // For single: .from().select().eq().single()
  // etc. All return the chain, and the final call resolves
  mockChain.order.mockResolvedValue({ data, error });
  mockChain.single.mockResolvedValue({ data, error });
  mockChain.eq.mockReturnValue(mockChain);
  mockChain.delete.mockReturnValue(mockChain);
}

describe('itemService.list', () => {
  it('returns mapped items', async () => {
    const rows = [
      {
        id: 'i1',
        user_id: 'u1',
        title: 'Test',
        type: 'task',
        module: 'work',
        priority: null,
        tags: ['tag1'],
        parent_id: null,
        completed: false,
        completed_at: null,
        archived: false,
        due_date: '2025-06-15',
        due_time: null,
        recurrence: null,
        ritual_period: null,
        emotion_before: null,
        emotion_after: null,
        needs_checkin: false,
        is_chore: false,
        energy_cost: null,
        description: null,
        context: null,
        created_at: '2025-06-01T00:00:00Z',
        updated_at: '2025-06-01T00:00:00Z',
      },
    ];
    resolveChain(rows);

    const result = await itemService.list('u1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('i1');
    expect(result[0].title).toBe('Test');
    expect(result[0].module).toBe('work');
    expect(result[0].tags).toEqual(['tag1']);
  });

  it('returns empty array when no data', async () => {
    resolveChain(null);
    const result = await itemService.list('u1');
    expect(result).toEqual([]);
  });

  it('throws on supabase error', async () => {
    mockChain.order.mockResolvedValue({ data: null, error: { message: 'db fail' } });
    await expect(itemService.list('u1')).rejects.toBeDefined();
  });
});

describe('itemService.update', () => {
  it('throws when trying to complete a reflection', async () => {
    await expect(
      itemService.update('i1', { completed: true, type: 'reflection' })
    ).rejects.toThrow('Reflections cannot be completed');
  });
});

describe('itemService.complete', () => {
  it('calls update with completed=true and completed_at', async () => {
    const mockData = {
      id: 'i1',
      user_id: 'u1',
      title: 'Done',
      type: 'task',
      completed: true,
      completed_at: '2025-06-01T12:00:00Z',
      archived: false,
      tags: [],
      parent_id: null,
      module: null,
      priority: null,
      due_date: null,
      due_time: null,
      recurrence: null,
      ritual_period: null,
      emotion_before: null,
      emotion_after: null,
      needs_checkin: false,
      is_chore: false,
      energy_cost: null,
      description: null,
      context: null,
      created_at: '2025-06-01T00:00:00Z',
      updated_at: '2025-06-01T12:00:00Z',
    };
    resolveChain(mockData);

    const result = await itemService.complete('i1');
    expect(result.completed).toBe(true);
  });
});

describe('itemService.uncomplete', () => {
  it('calls update with completed=false and completed_at=null', async () => {
    const mockData = {
      id: 'i1',
      user_id: 'u1',
      title: 'Undone',
      type: 'task',
      completed: false,
      completed_at: null,
      archived: false,
      tags: [],
      parent_id: null,
      module: null,
      priority: null,
      due_date: null,
      due_time: null,
      recurrence: null,
      ritual_period: null,
      emotion_before: null,
      emotion_after: null,
      needs_checkin: false,
      is_chore: false,
      energy_cost: null,
      description: null,
      context: null,
      created_at: '2025-06-01T00:00:00Z',
      updated_at: '2025-06-01T12:00:00Z',
    };
    resolveChain(mockData);

    const result = await itemService.uncomplete('i1');
    expect(result.completed).toBe(false);
    expect(result.completed_at).toBeNull();
  });
});

describe('itemService.delete', () => {
  it('does not throw on success', async () => {
    mockChain.eq.mockResolvedValue({ error: null });
    await expect(itemService.delete('i1')).resolves.toBeUndefined();
  });
});
