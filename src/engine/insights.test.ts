// engine/insights.test.ts — Insights engine tests
import { describe, it, expect } from 'vitest';
import { mockItem } from '@/__test__/mock-factory';
import {
  computeEmotionProductivity,
  computePeriodProductivity,
  computeWeekdayPatterns,
  generateInsights,
} from './insights';

// ─── computeEmotionProductivity ─────────────────────────────

describe('computeEmotionProductivity', () => {
  it('returns empty for items without emotions', () => {
    const items = [mockItem(), mockItem()];
    expect(computeEmotionProductivity(items)).toEqual([]);
  });

  it('computes completion rate per emotion', () => {
    const items = [
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'focado', completed: false }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
    ];
    const result = computeEmotionProductivity(items);
    const focado = result.find((r) => r.emotion === 'focado');
    const ansioso = result.find((r) => r.emotion === 'ansioso');

    expect(focado?.completionRate).toBe(67);
    expect(focado?.totalItems).toBe(3);
    expect(ansioso?.completionRate).toBe(0);
  });

  it('ignores archived items', () => {
    const items = [
      mockItem({ emotion_before: 'calmo', completed: true, archived: true }),
      mockItem({ emotion_before: 'calmo', completed: true, archived: true }),
    ];
    expect(computeEmotionProductivity(items)).toEqual([]);
  });

  it('requires min 2 items per emotion', () => {
    const items = [
      mockItem({ emotion_before: 'grato', completed: true }),
    ];
    expect(computeEmotionProductivity(items)).toEqual([]);
  });

  it('sorts by completion rate descending', () => {
    const items = [
      mockItem({ emotion_before: 'ansioso', completed: false }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'focado', completed: true }),
    ];
    const result = computeEmotionProductivity(items);
    expect(result[0].emotion).toBe('focado');
    expect(result[1].emotion).toBe('ansioso');
  });
});

// ─── computePeriodProductivity ───────────────────────────────

describe('computePeriodProductivity', () => {
  it('returns three periods', () => {
    const result = computePeriodProductivity([]);
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.period)).toEqual(['manha', 'tarde', 'noite']);
  });

  it('counts completed items by period', () => {
    // Use local-friendly timestamps (Date constructor uses local time)
    const morning1 = new Date(2026, 2, 9, 8, 0).toISOString();
    const morning2 = new Date(2026, 2, 9, 10, 30).toISOString();
    const afternoon = new Date(2026, 2, 9, 14, 0).toISOString();
    const items = [
      mockItem({ completed: true, completed_at: morning1 }),
      mockItem({ completed: true, completed_at: morning2 }),
      mockItem({ completed: true, completed_at: afternoon }),
    ];
    const result = computePeriodProductivity(items);
    expect(result.find((p) => p.period === 'manha')?.totalCompleted).toBe(2);
    expect(result.find((p) => p.period === 'tarde')?.totalCompleted).toBe(1);
    expect(result.find((p) => p.period === 'noite')?.totalCompleted).toBe(0);
  });

  it('tracks top module per period', () => {
    const t1 = new Date(2026, 2, 9, 9, 0).toISOString();
    const t2 = new Date(2026, 2, 9, 10, 0).toISOString();
    const t3 = new Date(2026, 2, 9, 11, 0).toISOString();
    const items = [
      mockItem({ completed: true, completed_at: t1, module: 'work' }),
      mockItem({ completed: true, completed_at: t2, module: 'work' }),
      mockItem({ completed: true, completed_at: t3, module: 'body' }),
    ];
    const result = computePeriodProductivity(items);
    const manha = result.find((p) => p.period === 'manha');
    expect(manha?.topModule).toBe('work');
  });

  it('ignores non-completed items', () => {
    const items = [
      mockItem({ completed: false, completed_at: null }),
    ];
    const result = computePeriodProductivity(items);
    expect(result.every((p) => p.totalCompleted === 0)).toBe(true);
  });
});

// ─── computeWeekdayPatterns ─────────────────────────────────

describe('computeWeekdayPatterns', () => {
  it('returns 7 days starting from Monday', () => {
    const result = computeWeekdayPatterns([]);
    expect(result).toHaveLength(7);
    expect(result[0].label).toBe('Segunda');
    expect(result[6].label).toBe('Domingo');
  });

  it('counts completed items per weekday', () => {
    // 2026-03-09 is Monday
    const items = [
      mockItem({ completed: true, completed_at: '2026-03-09T10:00:00Z' }), // Monday
      mockItem({ completed: true, completed_at: '2026-03-09T12:00:00Z' }), // Monday
      mockItem({ completed: true, completed_at: '2026-03-10T10:00:00Z' }), // Tuesday
    ];
    const result = computeWeekdayPatterns(items);
    const monday = result.find((w) => w.day === 1);
    const tuesday = result.find((w) => w.day === 2);
    expect(monday?.completed).toBe(2);
    expect(tuesday?.completed).toBe(1);
  });

  it('computes positive emotion ratio per day', () => {
    const items = [
      mockItem({ completed: true, completed_at: '2026-03-09T10:00:00Z', emotion_before: 'focado' }),
      mockItem({ completed: true, completed_at: '2026-03-09T12:00:00Z', emotion_before: 'ansioso' }),
    ];
    const result = computeWeekdayPatterns(items);
    const monday = result.find((w) => w.day === 1);
    expect(monday?.avgPositiveRatio).toBe(0.5);
  });
});

// ─── generateInsights ───────────────────────────────────────

describe('generateInsights', () => {
  it('returns empty for too few items', () => {
    const items = [mockItem(), mockItem()];
    expect(generateInsights(items)).toEqual([]);
  });

  it('generates best-emotion insight when data exists', () => {
    const items = [
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
    ];
    const insights = generateInsights(items);
    const bestEmotion = insights.find((i) => i.id === 'best-emotion');
    expect(bestEmotion).toBeDefined();
    expect(bestEmotion?.text).toContain('focado');
    expect(bestEmotion?.text).toContain('100%');
  });

  it('generates worst-emotion correlation when gap is significant', () => {
    const items = [
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
    ];
    const insights = generateInsights(items);
    const worst = insights.find((i) => i.id === 'worst-emotion');
    expect(worst).toBeDefined();
    expect(worst?.text).toContain('ansioso');
  });

  it('generates suggestion for high challenging emotions', () => {
    const items = [
      mockItem({ emotion_before: 'ansioso', completed: false }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
      mockItem({ emotion_before: 'cansado', completed: false }),
      mockItem({ emotion_before: 'cansado', completed: true }),
      mockItem({ emotion_before: 'frustrado', completed: false }),
      mockItem({ emotion_before: 'frustrado', completed: false }),
    ];
    const insights = generateInsights(items);
    const suggestion = insights.find((i) => i.id === 'suggestion-checkin');
    expect(suggestion).toBeDefined();
    expect(suggestion?.type).toBe('suggestion');
  });

  it('generates high-energy suggestion when completion is low', () => {
    const items = [
      mockItem({ energy_cost: 5, completed: false }),
      mockItem({ energy_cost: 4, completed: false }),
      mockItem({ energy_cost: 4, completed: false }),
      mockItem({ energy_cost: 2, completed: true }),
    ];
    const insights = generateInsights(items);
    const energySuggestion = insights.find((i) => i.id === 'suggestion-energy');
    expect(energySuggestion).toBeDefined();
    expect(energySuggestion?.text).toContain('alta energia');
  });

  it('sorts insights by priority', () => {
    const items = [
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
      mockItem({ completed: true, completed_at: '2026-03-09T09:00:00Z' }),
      mockItem({ completed: true, completed_at: '2026-03-09T10:00:00Z' }),
      mockItem({ completed: true, completed_at: '2026-03-09T11:00:00Z' }),
    ];
    const insights = generateInsights(items);
    for (let i = 1; i < insights.length; i++) {
      expect(insights[i].priority).toBeGreaterThanOrEqual(insights[i - 1].priority);
    }
  });

  it('insight types are valid', () => {
    const validTypes = ['correlation', 'timing', 'pattern', 'suggestion'];
    const items = [
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'focado', completed: true }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
      mockItem({ emotion_before: 'ansioso', completed: false }),
    ];
    const insights = generateInsights(items);
    for (const insight of insights) {
      expect(validTypes).toContain(insight.type);
    }
  });
});
