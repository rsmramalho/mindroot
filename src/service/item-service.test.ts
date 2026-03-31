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
        tags: ['tag1'],
        status: 'active',
        state: 'inbox',
        genesis_stage: 1,
        project_id: null,
        naming_convention: null,
        notes: null,
        body: {},
        source: 'mindroot',
        created_at: '2025-06-01T00:00:00Z',
        updated_at: '2025-06-01T00:00:00Z',
        created_by: null,
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
  it('updates item fields', async () => {
    const mockData = {
      id: 'i1',
      user_id: 'u1',
      title: 'Updated',
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
      created_at: '2025-06-01T00:00:00Z',
      updated_at: '2025-06-01T12:00:00Z',
      created_by: null,
    };
    resolveChain(mockData);

    const result = await itemService.update('i1', { title: 'Updated' });
    expect(result.title).toBe('Updated');
  });
});

describe('itemService.delete', () => {
  it('does not throw on success', async () => {
    mockChain.eq.mockResolvedValue({ error: null });
    await expect(itemService.delete('i1')).resolves.toBeUndefined();
  });
});
