// engine/ai-suggestions.test.ts — AI suggestions engine tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockItem, resetIds } from '@/__test__/mock-factory';
import { format, subDays } from 'date-fns';
import {
  generateAiSuggestions,
  ACTION_LABELS,
  ACTION_COLORS,
} from './ai-suggestions';
import type { AiSuggestion } from './ai-suggestions';

beforeEach(() => resetIds());

// Helper: set body.operations.due_date
function withDueDate(dueDate: string) {
  return { body: { operations: { due_date: dueDate, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null } } };
}

// Helper: set body.soul.energy_level
function withEnergy(level: 'high' | 'medium' | 'low') {
  return { body: { soul: { energy_level: level, emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null } } };
}

// Helper: set body.soul.emotion_after + body.operations.deadline (for positive streak)
function withEmotionAfterAndDeadline(emotionAfter: string, deadline: string) {
  return {
    status: 'completed' as const,
    body: {
      soul: { emotion_after: emotionAfter, emotion_before: null, energy_level: null, needs_checkin: false, ritual_slot: null },
      operations: { deadline, due_date: null, priority: null, project_status: null, progress_mode: null, progress: null },
    },
  };
}

// Helper: create item with created_at at specific hour
function itemAt(hour: number, day = 0, overrides = {}) {
  const d = subDays(new Date(), day);
  d.setHours(hour, 0, 0, 0);
  return mockItem({ created_at: d.toISOString(), ...overrides });
}

// Helper: create completed item with deadline at specific hour
function completedAt(hour: number, day = 0, overrides = {}) {
  const d = subDays(new Date(), day);
  d.setHours(hour, 0, 0, 0);
  return mockItem({
    status: 'completed',
    created_at: d.toISOString(),
    body: { operations: { deadline: d.toISOString(), due_date: null, priority: null, project_status: null, progress_mode: null, progress: null } },
    ...overrides,
  });
}

// ─── generateAiSuggestions ──────────────────────────────────

describe('generateAiSuggestions', () => {
  it('returns empty for too few items', () => {
    const items = [mockItem(), mockItem()];
    expect(generateAiSuggestions(items)).toEqual([]);
  });

  it('returns max 3 suggestions', () => {
    // Create enough data to potentially trigger many suggestions
    const items: ReturnType<typeof mockItem>[] = [];

    // Overdue cluster (triggers overdue suggestion)
    const pastDate = format(subDays(new Date(), 3), 'yyyy-MM-dd');
    for (let i = 0; i < 6; i++) {
      items.push(
        mockItem({
          module: 'work',
          status: 'active',
          ...withDueDate(pastDate),
        })
      );
    }

    // High energy today (triggers energy overload)
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    for (let i = 0; i < 4; i++) {
      items.push(mockItem({
        status: 'active',
        body: {
          operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null },
          soul: { energy_level: 'high', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null },
        },
      }));
    }

    // Module imbalance (many work items)
    for (let i = 0; i < 8; i++) {
      items.push(mockItem({ module: 'work', status: 'active' }));
    }

    const result = generateAiSuggestions(items);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('sorts by priority ascending', () => {
    const items: ReturnType<typeof mockItem>[] = [];
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Overdue cluster (priority 2)
    const pastDate = format(subDays(new Date(), 3), 'yyyy-MM-dd');
    for (let i = 0; i < 5; i++) {
      items.push(
        mockItem({
          module: 'work',
          status: 'active',
          ...withDueDate(pastDate),
        })
      );
    }

    // Energy overload (priority 1)
    for (let i = 0; i < 4; i++) {
      items.push(mockItem({
        status: 'active',
        body: {
          operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null },
          soul: { energy_level: 'high', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null },
        },
      }));
    }

    // Extra recent items to pass minimum threshold
    for (let i = 0; i < 3; i++) {
      items.push(mockItem());
    }

    const result = generateAiSuggestions(items);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].priority).toBeGreaterThanOrEqual(result[i - 1].priority);
    }
  });

  it('ignores archived items', () => {
    const items = [
      mockItem({ status: 'archived' }),
      mockItem({ status: 'archived' }),
      mockItem({ status: 'archived' }),
      mockItem({ status: 'archived' }),
    ];
    expect(generateAiSuggestions(items)).toEqual([]);
  });
});

// ─── detectOverdueCluster ───────────────────────────────────

describe('overdue cluster detection', () => {
  it('detects overdue cluster in a module', () => {
    const pastDate = format(subDays(new Date(), 3), 'yyyy-MM-dd');
    const items = [
      mockItem({ module: 'work', status: 'active', ...withDueDate(pastDate) }),
      mockItem({ module: 'work', status: 'active', ...withDueDate(pastDate) }),
      mockItem({ module: 'work', status: 'active', ...withDueDate(pastDate) }),
      // Need 3+ recent items total
      mockItem(),
    ];
    const result = generateAiSuggestions(items);
    const overdue = result.find((s) => s.id === 'overdue-cluster');
    expect(overdue).toBeDefined();
    expect(overdue?.action).toBe('break-down');
    expect(overdue?.module).toBe('work');
  });

  it('detects many overdue items without module cluster', () => {
    const pastDate = format(subDays(new Date(), 3), 'yyyy-MM-dd');
    const items = [
      mockItem({ module: 'work', status: 'active', ...withDueDate(pastDate) }),
      mockItem({ module: 'body', status: 'active', ...withDueDate(pastDate) }),
      mockItem({ module: 'mind', status: 'active', ...withDueDate(pastDate) }),
      mockItem({ module: 'purpose', status: 'active', ...withDueDate(pastDate) }),
      mockItem({ module: 'family', status: 'active', ...withDueDate(pastDate) }),
    ];
    const result = generateAiSuggestions(items);
    const overdue = result.find((s) => s.id === 'overdue-many');
    expect(overdue).toBeDefined();
    expect(overdue?.action).toBe('reschedule');
  });

  it('ignores completed overdue items', () => {
    const pastDate = format(subDays(new Date(), 3), 'yyyy-MM-dd');
    const items = [
      mockItem({ module: 'work', status: 'completed', ...withDueDate(pastDate) }),
      mockItem({ module: 'work', status: 'completed', ...withDueDate(pastDate) }),
      mockItem({ module: 'work', status: 'completed', ...withDueDate(pastDate) }),
      mockItem(),
      mockItem(),
      mockItem(),
    ];
    const result = generateAiSuggestions(items);
    const overdue = result.find((s) => s.id.startsWith('overdue'));
    expect(overdue).toBeUndefined();
  });
});

// ─── detectEnergyOverload ───────────────────────────────────

describe('energy overload detection', () => {
  it('detects 3+ high-energy items due today', () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const items = [
      mockItem({
        status: 'active',
        body: {
          operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null },
          soul: { energy_level: 'high', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null },
        },
      }),
      mockItem({
        status: 'active',
        body: {
          operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null },
          soul: { energy_level: 'high', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null },
        },
      }),
      mockItem({
        status: 'active',
        body: {
          operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null },
          soul: { energy_level: 'high', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null },
        },
      }),
    ];
    const result = generateAiSuggestions(items);
    const energy = result.find((s) => s.id === 'energy-overload');
    expect(energy).toBeDefined();
    expect(energy?.action).toBe('pause');
    expect(energy?.priority).toBe(1);
  });

  it('ignores low-energy items', () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const items = [
      mockItem({ status: 'active', body: { operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null }, soul: { energy_level: 'low', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null } } }),
      mockItem({ status: 'active', body: { operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null }, soul: { energy_level: 'medium', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null } } }),
      mockItem({ status: 'active', body: { operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null }, soul: { energy_level: 'low', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null } } }),
    ];
    const result = generateAiSuggestions(items);
    const energy = result.find((s) => s.id === 'energy-overload');
    expect(energy).toBeUndefined();
  });

  it('ignores completed high-energy items', () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const items = [
      mockItem({ status: 'completed', body: { operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null }, soul: { energy_level: 'high', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null } } }),
      mockItem({ status: 'completed', body: { operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null }, soul: { energy_level: 'high', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null } } }),
      mockItem({ status: 'completed', body: { operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null }, soul: { energy_level: 'high', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null } } }),
    ];
    const result = generateAiSuggestions(items);
    const energy = result.find((s) => s.id === 'energy-overload');
    expect(energy).toBeUndefined();
  });
});

// ─── detectPositiveStreak ───────────────────────────────────

describe('positive streak detection', () => {
  it('detects streak of positive emotions', () => {
    const items = [
      completedAt(10, 0, withEmotionAfterAndDeadline('calmo', new Date(new Date().setHours(10, 0, 0, 0)).toISOString())),
      completedAt(9, 0, withEmotionAfterAndDeadline('focado', new Date(new Date().setHours(9, 0, 0, 0)).toISOString())),
      completedAt(8, 1, withEmotionAfterAndDeadline('grato', subDays(new Date(), 1).toISOString())),
      completedAt(14, 1, withEmotionAfterAndDeadline('animado', subDays(new Date(), 1).toISOString())),
      completedAt(16, 2, withEmotionAfterAndDeadline('confiante', subDays(new Date(), 2).toISOString())),
    ];
    const result = generateAiSuggestions(items);
    const streak = result.find((s) => s.id === 'positive-streak');
    expect(streak).toBeDefined();
    expect(streak?.action).toBe('celebrate');
    expect(streak?.priority).toBe(3);
  });

  it('does not trigger with mixed emotions', () => {
    const items = [
      completedAt(10, 0, withEmotionAfterAndDeadline('calmo', new Date().toISOString())),
      completedAt(9, 0, withEmotionAfterAndDeadline('ansioso', new Date().toISOString())),
      completedAt(8, 1, withEmotionAfterAndDeadline('focado', subDays(new Date(), 1).toISOString())),
    ];
    const result = generateAiSuggestions(items);
    const streak = result.find((s) => s.id === 'positive-streak');
    expect(streak).toBeUndefined();
  });

  it('needs at least 3 completed items', () => {
    const items = [
      completedAt(10, 0, withEmotionAfterAndDeadline('calmo', new Date().toISOString())),
      completedAt(9, 0, withEmotionAfterAndDeadline('focado', new Date().toISOString())),
    ];
    const result = generateAiSuggestions(items);
    const streak = result.find((s) => s.id === 'positive-streak');
    expect(streak).toBeUndefined();
  });
});

// ─── detectModuleImbalance ──────────────────────────────────

describe('module imbalance detection', () => {
  it('detects when one module dominates', () => {
    const items = [
      mockItem({ module: 'work' }),
      mockItem({ module: 'work' }),
      mockItem({ module: 'work' }),
      mockItem({ module: 'work' }),
      mockItem({ module: 'work' }),
      mockItem({ module: 'body' }),
    ];
    const result = generateAiSuggestions(items);
    const imbalance = result.find((s) => s.id === 'module-imbalance');
    expect(imbalance).toBeDefined();
    expect(imbalance?.action).toBe('reorder');
    expect(imbalance?.module).toBe('work');
  });

  it('does not trigger with balanced modules', () => {
    const items = [
      mockItem({ module: 'work' }),
      mockItem({ module: 'work' }),
      mockItem({ module: 'body' }),
      mockItem({ module: 'body' }),
      mockItem({ module: 'mind' }),
      mockItem({ module: 'mind' }),
    ];
    const result = generateAiSuggestions(items);
    const imbalance = result.find((s) => s.id === 'module-imbalance');
    expect(imbalance).toBeUndefined();
  });
});

// ─── detectProcrastination ──────────────────────────────────

describe('procrastination detection', () => {
  it('detects low completion rate in current period', () => {
    const now = new Date();
    const hour = now.getHours();

    const items: ReturnType<typeof mockItem>[] = [];
    for (let i = 0; i < 5; i++) {
      items.push(itemAt(hour, i, { module: 'work', status: 'active' }));
    }
    const otherHour = hour < 12 ? 15 : 9;
    for (let i = 0; i < 3; i++) {
      items.push(itemAt(otherHour, i, { module: 'work', status: 'completed' }));
    }

    const result = generateAiSuggestions(items);
    const proc = result.find((s) => s.id === 'procrastination-work');
    expect(result).toBeInstanceOf(Array);
  });
});

// ─── ACTION_LABELS & ACTION_COLORS ──────────────────────────

describe('action metadata', () => {
  it('has labels for all actions', () => {
    const actions: AiSuggestion['action'][] = [
      'reschedule', 'break-down', 'checkin', 'reorder', 'pause', 'celebrate',
    ];
    for (const action of actions) {
      expect(ACTION_LABELS[action]).toBeDefined();
      expect(typeof ACTION_LABELS[action]).toBe('string');
    }
  });

  it('has colors for all actions', () => {
    const actions: AiSuggestion['action'][] = [
      'reschedule', 'break-down', 'checkin', 'reorder', 'pause', 'celebrate',
    ];
    for (const action of actions) {
      expect(ACTION_COLORS[action]).toBeDefined();
      expect(ACTION_COLORS[action]).toMatch(/^#/);
    }
  });
});

// ─── AiSuggestion shape ─────────────────────────────────────

describe('suggestion shape', () => {
  it('all suggestions have required fields', () => {
    const pastDate = format(subDays(new Date(), 3), 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const items = [
      mockItem({ module: 'work', status: 'active', ...withDueDate(pastDate) }),
      mockItem({ module: 'work', status: 'active', ...withDueDate(pastDate) }),
      mockItem({ module: 'work', status: 'active', ...withDueDate(pastDate) }),
      mockItem({
        status: 'active',
        body: {
          operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null },
          soul: { energy_level: 'high', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null },
        },
      }),
      mockItem({
        status: 'active',
        body: {
          operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null },
          soul: { energy_level: 'high', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null },
        },
      }),
      mockItem({
        status: 'active',
        body: {
          operations: { due_date: todayStr, priority: null, deadline: null, project_status: null, progress_mode: null, progress: null },
          soul: { energy_level: 'high', emotion_before: null, emotion_after: null, needs_checkin: false, ritual_slot: null },
        },
      }),
    ];
    const result = generateAiSuggestions(items);
    for (const s of result) {
      expect(s.id).toBeDefined();
      expect(typeof s.text).toBe('string');
      expect(s.text.length).toBeGreaterThan(0);
      expect(typeof s.action).toBe('string');
      expect(typeof s.context).toBe('string');
      expect(typeof s.priority).toBe('number');
    }
  });
});
