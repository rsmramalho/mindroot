// types/item.test.ts — Constants consistency checks
import { describe, it, expect } from 'vitest';
import {
  EMOTIONS,
  POSITIVE_EMOTIONS,
  CHALLENGING_EMOTIONS,
  MODULES,
  PRIORITIES,
} from './item';

describe('Emotion constants', () => {
  it('EMOTIONS has 11 entries', () => {
    expect(EMOTIONS).toHaveLength(11);
  });

  it('POSITIVE_EMOTIONS + CHALLENGING_EMOTIONS + neutro = EMOTIONS', () => {
    const combined = [...POSITIVE_EMOTIONS, ...CHALLENGING_EMOTIONS, 'neutro'];
    expect(combined.sort()).toEqual([...EMOTIONS].sort());
  });

  it('POSITIVE_EMOTIONS and CHALLENGING_EMOTIONS do not overlap', () => {
    const overlap = POSITIVE_EMOTIONS.filter((e) => CHALLENGING_EMOTIONS.includes(e as any));
    expect(overlap).toHaveLength(0);
  });

  it('all POSITIVE_EMOTIONS are in EMOTIONS', () => {
    for (const e of POSITIVE_EMOTIONS) {
      expect(EMOTIONS).toContain(e);
    }
  });

  it('all CHALLENGING_EMOTIONS are in EMOTIONS', () => {
    for (const e of CHALLENGING_EMOTIONS) {
      expect(EMOTIONS).toContain(e);
    }
  });
});

describe('Module constants', () => {
  it('MODULES has 6 entries', () => {
    expect(MODULES).toHaveLength(6);
  });

  it('all modules have key, label, color', () => {
    for (const mod of MODULES) {
      expect(mod.key).toBeTruthy();
      expect(mod.label).toBeTruthy();
      expect(mod.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('module keys are unique', () => {
    const keys = MODULES.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('Priority constants', () => {
  it('PRIORITIES has 4 entries', () => {
    expect(PRIORITIES).toHaveLength(4);
  });

  it('all priorities have key, label, color', () => {
    for (const p of PRIORITIES) {
      expect(p.key).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('priority order matches expectation', () => {
    const keys = PRIORITIES.map((p) => p.key);
    expect(keys).toEqual(['urgente', 'importante', 'manutencao', 'futuro']);
  });
});
