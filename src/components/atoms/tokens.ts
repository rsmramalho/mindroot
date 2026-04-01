// atoms/tokens.ts — Design tokens for MindRoot UI v2

import type { AtomModule, AtomType } from '@/types/item';

// ─── Module Colors ──────────────────────────────────────

export const MODULE_COLORS: Record<AtomModule, string> = {
  work: '#8a9e7a',
  body: '#b8c4a8',
  mind: '#a89478',
  family: '#d4856a',
  purpose: '#c4a882',
  bridge: '#8a8a8a',
  finance: '#7a9e8a',
  social: '#9e7a8a',
};

// ─── Stage Colors (Genesis 1-7) ─────────────────────────

export const STAGE_COLORS: Record<number, string> = {
  1: '#6b6b6b', // Point — muted
  2: '#8a9e7a', // Line — green
  3: '#7a8fb8', // Triangle — blue
  4: '#c4a882', // Square — gold
  5: '#b8896a', // Pentagon — amber
  6: '#9e7ab8', // Hexagon — purple
  7: '#d4b872', // Circle — bright gold
};

export const STAGE_GEOMETRIES: Record<number, string> = {
  1: '\u00B7',  // ·
  2: '\u2014',  // —
  3: '\u25B3',  // △
  4: '\u25A1',  // □
  5: '\u2B20',  // ⬠
  6: '\u2B21',  // ⬡
  7: '\u25CB',  // ○
};

export const STAGE_NAMES: Record<number, string> = {
  1: 'Ponto',
  2: 'Linha',
  3: 'Triangulo',
  4: 'Quadrado',
  5: 'Pentagono',
  6: 'Hexagono',
  7: 'Circulo',
};

// ─── Type Chip Colors ───────────────────────────────────

export const TYPE_COLORS: Partial<Record<AtomType, string>> = {
  task: '#7a8fb8',
  spec: '#9e7ab8',
  note: '#8a9e7a',
  reflection: '#c47a9e',
  recipe: '#c4a872',
  habit: '#b8896a',
  project: '#b87a7a',
  wrap: '#d4b872',
  'session-log': '#8a8a8a',
  ritual: '#c4a882',
  workout: '#b8c4a8',
  checkpoint: '#7a9e8a',
  review: '#9e7a8a',
  recommendation: '#a89478',
  podcast: '#7ab8b8',
  article: '#8ab89e',
  resource: '#8a8a8a',
  list: '#a89e7a',
  log: '#7a7a8a',
  doc: '#8a9e8a',
  research: '#7a8fb8',
  template: '#8a8a8a',
  lib: '#9e8a7a',
};

export function getTypeColor(type: AtomType): string {
  return TYPE_COLORS[type] ?? '#8a8a8a';
}

// ─── Period Themes ──────────────────────────────────────

export const PERIOD_GRADIENTS = {
  aurora: 'linear-gradient(135deg, #f0c674 0%, #d4a854 50%, #c49044 100%)',
  zenite: 'linear-gradient(135deg, #e8e0d4 0%, #d4cfc4 50%, #c4bcb0 100%)',
  crepusculo: 'linear-gradient(135deg, #8a6e5a 0%, #6a4e3a 50%, #5a3e2a 100%)',
} as const;
