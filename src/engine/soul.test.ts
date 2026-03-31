// engine/soul.test.ts — Soul Engine tests
// Check-in triggers, emotional shift detection, period prompts
import { describe, it, expect } from 'vitest';
import {
  shouldTriggerCheckIn,
  detectShift,
  getRandomPrompt,
  PERIOD_PROMPTS,
} from './soul';
import type { AtomItem } from '@/types/item';

// ─── Factory ─────────────────────────────────────────────

function makeItem(overrides: Partial<AtomItem> = {}): AtomItem {
  return {
    id: 'test-id',
    user_id: 'user-id',
    title: 'Test item',
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

// Helper: create item with soul extension
function withSoul(soul: { needs_checkin?: boolean; emotion_before?: string | null; emotion_after?: string | null }) {
  return {
    body: {
      soul: {
        needs_checkin: soul.needs_checkin ?? false,
        emotion_before: soul.emotion_before ?? null,
        emotion_after: soul.emotion_after ?? null,
        energy_level: null,
        ritual_slot: null,
      },
    },
  };
}

// ─── shouldTriggerCheckIn ────────────────────────────────

describe('shouldTriggerCheckIn', () => {
  it('returns null when item is NOT completed', () => {
    const item = makeItem({ status: 'active', ...withSoul({ needs_checkin: true }) });
    expect(shouldTriggerCheckIn(item)).toBeNull();
  });

  it('triggers when needs_checkin is true and completed', () => {
    const item = makeItem({ status: 'completed', ...withSoul({ needs_checkin: true }) });
    const trigger = shouldTriggerCheckIn(item);
    expect(trigger).not.toBeNull();
    expect(trigger!.reason).toBe('task_complete');
    expect(trigger!.item_id).toBe('test-id');
  });

  it('triggers with reason chore_complete for chore items', () => {
    const item = makeItem({ status: 'completed', tags: ['chore'] });
    const trigger = shouldTriggerCheckIn(item);
    expect(trigger).not.toBeNull();
    expect(trigger!.reason).toBe('chore_complete');
  });

  it('triggers with reason chore_complete when needs_checkin AND is_chore', () => {
    const item = makeItem({ status: 'completed', tags: ['chore'], ...withSoul({ needs_checkin: true }) });
    const trigger = shouldTriggerCheckIn(item);
    expect(trigger!.reason).toBe('chore_complete');
  });

  it('triggers when item has emotion_before and is completed', () => {
    const item = makeItem({ status: 'completed', ...withSoul({ emotion_before: 'ansioso' }) });
    const trigger = shouldTriggerCheckIn(item);
    expect(trigger).not.toBeNull();
    expect(trigger!.emotion_before).toBe('ansioso');
  });

  it('triggers for ritual type items when completed', () => {
    const item = makeItem({ type: 'ritual', status: 'completed' });
    const trigger = shouldTriggerCheckIn(item);
    expect(trigger).not.toBeNull();
    expect(trigger!.prompt).toBe('Como foi esse momento de ritual?');
  });

  it('returns null for plain completed task without any trigger flags', () => {
    const item = makeItem({ status: 'completed' });
    expect(shouldTriggerCheckIn(item)).toBeNull();
  });

  it('generates chore-specific prompt', () => {
    const item = makeItem({ status: 'completed', tags: ['chore'] });
    const trigger = shouldTriggerCheckIn(item);
    expect(trigger!.prompt).toBe('Trabalho invisível reconhecido. Como você se sente depois?');
  });

  it('generates challenging emotion prompt', () => {
    const item = makeItem({ status: 'completed', ...withSoul({ emotion_before: 'frustrado', needs_checkin: true }) });
    const trigger = shouldTriggerCheckIn(item);
    expect(trigger!.prompt).toContain('frustrado');
  });

  it('generates positive emotion prompt', () => {
    const item = makeItem({ status: 'completed', ...withSoul({ emotion_before: 'animado', needs_checkin: true }) });
    const trigger = shouldTriggerCheckIn(item);
    expect(trigger!.prompt).toContain('animado');
  });

  it('generates neutral emotion prompt', () => {
    const item = makeItem({ status: 'completed', ...withSoul({ emotion_before: 'neutro', needs_checkin: true }) });
    const trigger = shouldTriggerCheckIn(item);
    expect(trigger!.prompt).toContain('neutro');
  });
});

// ─── detectShift ─────────────────────────────────────────

describe('detectShift', () => {
  it('returns positive when going from challenging to positive', () => {
    expect(detectShift('ansioso', 'calmo')).toBe('positive');
    expect(detectShift('frustrado', 'grato')).toBe('positive');
    expect(detectShift('triste', 'animado')).toBe('positive');
    expect(detectShift('cansado', 'confiante')).toBe('positive');
    expect(detectShift('perdido', 'focado')).toBe('positive');
  });

  it('returns negative when going from positive to challenging', () => {
    expect(detectShift('calmo', 'ansioso')).toBe('negative');
    expect(detectShift('focado', 'frustrado')).toBe('negative');
    expect(detectShift('animado', 'triste')).toBe('negative');
  });

  it('returns stable when emotion stays the same', () => {
    expect(detectShift('calmo', 'calmo')).toBe('stable');
    expect(detectShift('ansioso', 'ansioso')).toBe('stable');
    expect(detectShift('neutro', 'neutro')).toBe('stable');
  });

  it('returns stable when both are positive (lateral move)', () => {
    expect(detectShift('calmo', 'focado')).toBe('stable');
    expect(detectShift('grato', 'animado')).toBe('stable');
  });

  it('returns stable when both are challenging (lateral move)', () => {
    expect(detectShift('ansioso', 'frustrado')).toBe('stable');
    expect(detectShift('triste', 'cansado')).toBe('stable');
  });

  it('returns unknown when before is null', () => {
    expect(detectShift(null, 'calmo')).toBe('unknown');
  });

  it('returns unknown when after is null', () => {
    expect(detectShift('calmo', null)).toBe('unknown');
  });

  it('returns unknown when both are null', () => {
    expect(detectShift(null, null)).toBe('unknown');
  });
});

// ─── getRandomPrompt / PERIOD_PROMPTS ────────────────────

describe('PERIOD_PROMPTS', () => {
  it('has prompts for all three periods', () => {
    expect(PERIOD_PROMPTS.aurora).toBeDefined();
    expect(PERIOD_PROMPTS.zenite).toBeDefined();
    expect(PERIOD_PROMPTS.crepusculo).toBeDefined();
  });

  it('each period has at least 1 prompt', () => {
    expect(PERIOD_PROMPTS.aurora.length).toBeGreaterThanOrEqual(1);
    expect(PERIOD_PROMPTS.zenite.length).toBeGreaterThanOrEqual(1);
    expect(PERIOD_PROMPTS.crepusculo.length).toBeGreaterThanOrEqual(1);
  });

  it('all prompts are non-empty strings', () => {
    for (const period of ['aurora', 'zenite', 'crepusculo'] as const) {
      for (const prompt of PERIOD_PROMPTS[period]) {
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('getRandomPrompt', () => {
  it('returns a string from the aurora prompts', () => {
    const prompt = getRandomPrompt('aurora');
    expect(PERIOD_PROMPTS.aurora).toContain(prompt);
  });

  it('returns a string from the zenite prompts', () => {
    const prompt = getRandomPrompt('zenite');
    expect(PERIOD_PROMPTS.zenite).toContain(prompt);
  });

  it('returns a string from the crepusculo prompts', () => {
    const prompt = getRandomPrompt('crepusculo');
    expect(PERIOD_PROMPTS.crepusculo).toContain(prompt);
  });

  it('never returns a prompt from a different period', () => {
    // Run multiple times to reduce flakiness
    for (let i = 0; i < 50; i++) {
      const prompt = getRandomPrompt('aurora');
      expect(PERIOD_PROMPTS.zenite).not.toContain(prompt);
      expect(PERIOD_PROMPTS.crepusculo).not.toContain(prompt);
    }
  });
});
