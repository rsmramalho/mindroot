// service/ai-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from './ai-service';
import type { AIParsedResult } from './ai-service';
import { mockParsedInput } from '@/__test__/mock-factory';

describe('aiService.mergeWithLocal', () => {
  const baseAI: AIParsedResult = {
    title: 'AI cleaned title',
    type: 'task',
    module: 'work',
    priority: 'high',
    emotion_before: 'ansioso',
    is_chore: false,
    due_date: '2025-06-15',
    due_time: '14:00',
    ritual_period: null,
    tags: ['ai-tag'],
  };

  it('AI wins for semantic fields (title, type, module, priority, emotion)', () => {
    const local = mockParsedInput({
      title: 'local title',
      type: 'note',
      module: 'family',
      priority: 'low',
      emotion_before: 'calmo',
    });
    const merged = aiService.mergeWithLocal(baseAI, local);
    expect(merged.title).toBe('AI cleaned title');
    expect(merged.type).toBe('task');
    expect(merged.module).toBe('work');
    expect(merged.priority).toBe('high');
    expect(merged.emotion_before).toBe('ansioso');
  });

  it('local wins for exact token matches (due_date, due_time)', () => {
    const local = mockParsedInput({
      due_date: '2025-06-20',
      due_time: '09:00',
    });
    const merged = aiService.mergeWithLocal(baseAI, local);
    expect(merged.due_date).toBe('2025-06-20');
    expect(merged.due_time).toBe('09:00');
  });

  it('falls back to AI date when local has none', () => {
    const local = mockParsedInput({ due_date: null, due_time: null });
    const merged = aiService.mergeWithLocal(baseAI, local);
    expect(merged.due_date).toBe('2025-06-15');
    expect(merged.due_time).toBe('14:00');
  });

  it('merges tags without duplicates', () => {
    const local = mockParsedInput({ tags: ['local-tag', 'ai-tag'] });
    const merged = aiService.mergeWithLocal(baseAI, local);
    expect(merged.tags).toEqual(['local-tag', 'ai-tag']);
  });

  it('AI is_chore wins over local', () => {
    const ai: AIParsedResult = { ...baseAI, is_chore: true };
    const local = mockParsedInput({ is_chore: false });
    const merged = aiService.mergeWithLocal(ai, local);
    expect(merged.is_chore).toBe(true);
  });

  it('AI ritual_period wins over local', () => {
    const ai: AIParsedResult = { ...baseAI, ritual_period: 'aurora' };
    const local = mockParsedInput({ ritual_period: null });
    const merged = aiService.mergeWithLocal(ai, local);
    expect(merged.ritual_period).toBe('aurora');
  });

  it('preserves local-only fields (tokens, context, emotion_after, needs_checkin)', () => {
    const local = mockParsedInput({
      emotion_after: 'calmo',
      needs_checkin: true,
      tokens: [{ raw: '#mod_work', type: 'module', value: 'work', position: 0 }],
      context: 'original input text',
    });
    const merged = aiService.mergeWithLocal(baseAI, local);
    expect(merged.tokens).toHaveLength(1);
    expect(merged.context).toBe('original input text');
    expect(merged.needs_checkin).toBe(true);
  });

  it('empty AI fields fall back to local', () => {
    const ai: AIParsedResult = {
      title: '',
      type: 'task',
      module: null,
      priority: null,
      emotion_before: null,
      is_chore: false,
      due_date: null,
      due_time: null,
      ritual_period: null,
      tags: [],
    };
    const local = mockParsedInput({
      title: 'local title',
      module: 'family',
      priority: 'medium',
      emotion_before: 'focado',
    });
    const merged = aiService.mergeWithLocal(ai, local);
    expect(merged.title).toBe('local title');
    expect(merged.module).toBe('family');
    expect(merged.priority).toBe('medium');
    expect(merged.emotion_before).toBe('focado');
  });
});

describe('aiService.parseInput', () => {
  // Mock supabase.functions.invoke
  vi.mock('./supabase', () => ({
    supabase: {
      functions: {
        invoke: vi.fn(),
      },
    },
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null on error (fallback to local)', async () => {
    const { supabase } = await import('./supabase');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new Error('Edge function failed'),
    });

    const result = await aiService.parseInput('comprar leite');
    expect(result).toBeNull();
  });

  it('returns null when data has no title', async () => {
    const { supabase } = await import('./supabase');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { type: 'task' },
      error: null,
    });

    const result = await aiService.parseInput('test');
    expect(result).toBeNull();
  });

  it('returns parsed result on success', async () => {
    const { supabase } = await import('./supabase');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        title: 'comprar leite',
        type: 'task',
        module: null,
        priority: null,
        emotion_before: null,
        is_chore: false,
        due_date: '2025-06-15',
        due_time: null,
        ritual_period: null,
        tags: [],
      },
      error: null,
    });

    const result = await aiService.parseInput('comprar leite amanhã');
    expect(result).toBeDefined();
    expect(result!.title).toBe('comprar leite');
    expect(result!.due_date).toBe('2025-06-15');
  });

  it('defaults missing fields', async () => {
    const { supabase } = await import('./supabase');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { title: 'test' },
      error: null,
    });

    const result = await aiService.parseInput('test');
    expect(result).toBeDefined();
    expect(result!.type).toBe('task');
    expect(result!.module).toBeNull();
    expect(result!.tags).toEqual([]);
    expect(result!.is_chore).toBe(false);
  });

  it('returns null on network failure', async () => {
    const { supabase } = await import('./supabase');
    vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Network error'));

    const result = await aiService.parseInput('test');
    expect(result).toBeNull();
  });
});
