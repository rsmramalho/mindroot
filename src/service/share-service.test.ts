// service/share-service.test.ts — Share service tests
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockDelete = vi.fn(() => ({ eq: mockEq }));
const mockEq = vi.fn(() => ({ eq: mockEq, maybeSingle: mockMaybeSingle, single: mockSingle }));

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
    })),
  },
}));

import { shareService } from './share-service';

beforeEach(() => {
  vi.clearAllMocks();
  // Reset chain defaults
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle });
  mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle, single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockDelete.mockReturnValue({ eq: mockEq });
});

// ─── generateShareToken ─────────────────────────────────────

describe('shareService.generateShareToken', () => {
  it('returns existing token if share already exists', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { token: 'existing-token' }, error: null });

    const token = await shareService.generateShareToken('item-1', 'reflection', {}, 'user-1');
    expect(token).toBe('existing-token');
  });

  it('creates new share and returns token', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockSingle.mockResolvedValueOnce({ data: { token: 'new-token' }, error: null });

    const token = await shareService.generateShareToken('item-1', 'reflection', { title: 'Test' }, 'user-1');
    expect(token).toBe('new-token');
  });

  it('throws on insert error', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockSingle.mockResolvedValueOnce({ data: null, error: new Error('insert failed') });

    await expect(
      shareService.generateShareToken('item-1', 'reflection', {}, 'user-1')
    ).rejects.toThrow('insert failed');
  });
});

// ─── getSharedContent ───────────────────────────────────────

describe('shareService.getSharedContent', () => {
  it('returns content for valid token', async () => {
    const share = {
      id: '1',
      token: 'abc',
      content_type: 'reflection',
      content_id: 'item-1',
      content_data: { title: 'Hello' },
      owner_id: 'user-1',
      created_at: '2026-03-09T10:00:00Z',
      expires_at: null,
    };
    mockMaybeSingle.mockResolvedValueOnce({ data: share, error: null });

    const result = await shareService.getSharedContent('abc');
    expect(result).toEqual(share);
  });

  it('returns null for missing token', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await shareService.getSharedContent('nonexistent');
    expect(result).toBeNull();
  });

  it('returns null for expired token', async () => {
    const share = {
      id: '1',
      token: 'abc',
      content_type: 'reflection',
      content_id: 'item-1',
      content_data: {},
      owner_id: 'user-1',
      created_at: '2026-03-01T10:00:00Z',
      expires_at: '2026-03-02T00:00:00Z', // expired
    };
    mockMaybeSingle.mockResolvedValueOnce({ data: share, error: null });

    const result = await shareService.getSharedContent('abc');
    expect(result).toBeNull();
  });

  it('throws on query error', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: new Error('query failed') });

    await expect(shareService.getSharedContent('abc')).rejects.toThrow('query failed');
  });
});

// ─── revokeShare ────────────────────────────────────────────

describe('shareService.revokeShare', () => {
  it('deletes share successfully', async () => {
    mockEq.mockResolvedValueOnce({ error: null } as never);

    await expect(shareService.revokeShare('abc')).resolves.toBeUndefined();
  });

  it('throws on delete error', async () => {
    mockEq.mockResolvedValueOnce({ error: new Error('delete failed') } as never);

    await expect(shareService.revokeShare('abc')).rejects.toThrow('delete failed');
  });
});

// ─── getExistingShare ───────────────────────────────────────

describe('shareService.getExistingShare', () => {
  it('returns token when share exists', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { token: 'found-token' }, error: null });

    const token = await shareService.getExistingShare('item-1', 'reflection', 'user-1');
    expect(token).toBe('found-token');
  });

  it('returns null when no share exists', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const token = await shareService.getExistingShare('item-1', 'reflection', 'user-1');
    expect(token).toBeNull();
  });

  it('works with streak content type', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { token: 'streak-token' }, error: null });

    const token = await shareService.getExistingShare('streak', 'streak', 'user-1');
    expect(token).toBe('streak-token');
  });
});
