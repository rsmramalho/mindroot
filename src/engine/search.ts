// engine/search.ts — Advanced search & filter engine (pure logic)
// Parses search queries with filter prefixes and applies them to items

import type { AtomItem, AtomModule, Emotion, RitualSlot, Priority, AtomType, SoulExtension, OperationsExtension } from '@/types/item';
import { MODULES, EMOTIONS } from '@/types/item';
import { RITUAL_PERIODS } from '@/types/ui';
import { isToday, isThisWeek, isPast, isFuture, startOfDay, parseISO } from 'date-fns';

// ━━━ Types ━━━

export interface SearchFilters {
  text: string;
  module: AtomModule | null;
  emotion: Emotion | null;
  period: RitualSlot | null;
  priority: Priority | null;
  type: AtomType | null;
  tag: string | null;
  dateRange: 'hoje' | 'semana' | 'atrasado' | 'futuro' | null;
  completed: boolean | null; // null = don't filter
}

export interface SearchResult {
  item: AtomItem;
  score: number; // relevance score (higher = better match)
  matchField: 'title' | 'notes' | 'tag' | 'module' | 'emotion';
}

export const EMPTY_FILTERS: SearchFilters = {
  text: '',
  module: null,
  emotion: null,
  period: null,
  priority: null,
  type: null,
  tag: null,
  dateRange: null,
  completed: null,
};

// ━━━ Filter prefix definitions ━━━

const MODULE_KEYS = MODULES.map((m) => m.key);
const MODULE_LABELS_MAP: Record<string, AtomModule> = {};
for (const m of MODULES) {
  MODULE_LABELS_MAP[normalize(m.label)] = m.key;
  MODULE_LABELS_MAP[normalize(m.key)] = m.key;
}

const EMOTION_MAP: Record<string, Emotion> = {};
for (const e of EMOTIONS) {
  EMOTION_MAP[normalize(e)] = e;
}

const PERIOD_MAP: Record<string, RitualSlot> = {};
for (const p of RITUAL_PERIODS) {
  PERIOD_MAP[normalize(p.key)] = p.key as RitualSlot;
  PERIOD_MAP[normalize(p.label)] = p.key as RitualSlot;
}

const PRIORITY_MAP: Record<string, Priority> = {
  high: 'high',
  alta: 'high',
  medium: 'medium',
  media: 'medium',
  low: 'low',
  baixa: 'low',
};

const TYPE_MAP: Record<string, AtomType> = {
  task: 'task',
  tarefa: 'task',
  habit: 'habit',
  habito: 'habit',
  ritual: 'ritual',
  project: 'project',
  projeto: 'project',
  note: 'note',
  nota: 'note',
  reflection: 'reflection',
  reflexao: 'reflection',
  review: 'review',
  doc: 'doc',
  research: 'research',
  template: 'template',
  lib: 'lib',
};

const DATE_MAP: Record<string, SearchFilters['dateRange']> = {
  hoje: 'hoje',
  today: 'hoje',
  semana: 'semana',
  week: 'semana',
  atrasado: 'atrasado',
  overdue: 'atrasado',
  futuro: 'futuro',
  future: 'futuro',
};

// ━━━ Helpers ━━━

function getEmotionBefore(item: AtomItem): string | null {
  return (item.body?.soul as SoulExtension | undefined)?.emotion_before ?? null;
}

function getEmotionAfter(item: AtomItem): string | null {
  return (item.body?.soul as SoulExtension | undefined)?.emotion_after ?? null;
}

function getRitualSlot(item: AtomItem): RitualSlot | null {
  return (item.body?.soul as SoulExtension | undefined)?.ritual_slot ?? null;
}

function getPriority(item: AtomItem): Priority | null {
  return (item.body?.operations as OperationsExtension | undefined)?.priority ?? null;
}

function getDueDate(item: AtomItem): string | null {
  return (item.body?.operations as OperationsExtension | undefined)?.due_date ?? null;
}

// ━━━ Core functions ━━━

/** Normalize string for accent-insensitive matching */
export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Parse a search query string into structured filters.
 * Supports prefixes:
 *   mod:work  emo:calmo  per:aurora  prio:high  tipo:task  tag:frontend  data:hoje
 * Remaining text becomes the free-text search.
 */
export function parseSearchQuery(raw: string): SearchFilters {
  const filters: SearchFilters = { ...EMPTY_FILTERS };
  const parts: string[] = [];

  // Split by whitespace, process prefix tokens
  const tokens = raw.trim().split(/\s+/);

  for (const token of tokens) {
    const colonIdx = token.indexOf(':');
    if (colonIdx > 0 && colonIdx < token.length - 1) {
      const prefix = normalize(token.slice(0, colonIdx));
      const value = normalize(token.slice(colonIdx + 1));

      if (prefix === 'mod' || prefix === 'modulo') {
        const mod = MODULE_LABELS_MAP[value];
        if (mod) { filters.module = mod; continue; }
      }
      if (prefix === 'emo' || prefix === 'emocao') {
        const emo = EMOTION_MAP[value];
        if (emo) { filters.emotion = emo; continue; }
      }
      if (prefix === 'per' || prefix === 'periodo') {
        const per = PERIOD_MAP[value];
        if (per) { filters.period = per; continue; }
      }
      if (prefix === 'prio' || prefix === 'prioridade') {
        const prio = PRIORITY_MAP[value];
        if (prio) { filters.priority = prio; continue; }
      }
      if (prefix === 'tipo' || prefix === 'type') {
        const t = TYPE_MAP[value];
        if (t) { filters.type = t; continue; }
      }
      if (prefix === 'tag') {
        filters.tag = value;
        continue;
      }
      if (prefix === 'data' || prefix === 'date') {
        const dr = DATE_MAP[value];
        if (dr) { filters.dateRange = dr; continue; }
      }
    }
    // Not a recognized prefix — treat as free text
    parts.push(token);
  }

  filters.text = parts.join(' ').trim();
  return filters;
}

/**
 * Apply structured filters to an array of items.
 * Returns SearchResult[] sorted by relevance score (descending).
 */
export function searchItems(items: AtomItem[], filters: SearchFilters): SearchResult[] {
  const results: SearchResult[] = [];
  const q = normalize(filters.text);

  for (const item of items) {
    // Skip archived by default
    if (item.status === 'archived') continue;

    // Completed filter
    if (filters.completed === false && item.status === 'completed') continue;
    if (filters.completed === true && item.status !== 'completed') continue;

    // Module filter
    if (filters.module && item.module !== filters.module) continue;

    // Emotion filter (matches either before or after)
    if (filters.emotion) {
      if (getEmotionBefore(item) !== filters.emotion && getEmotionAfter(item) !== filters.emotion) continue;
    }

    // Period filter
    if (filters.period && getRitualSlot(item) !== filters.period) continue;

    // Priority filter
    if (filters.priority && getPriority(item) !== filters.priority) continue;

    // Type filter
    if (filters.type && item.type !== filters.type) continue;

    // Tag filter
    if (filters.tag) {
      const tagNorm = filters.tag;
      const hasTag = item.tags?.some((t) => normalize(t).includes(tagNorm));
      if (!hasTag) continue;
    }

    // Date range filter
    if (filters.dateRange) {
      const dueDate = getDueDate(item);
      const due = dueDate ? new Date(dueDate) : null;
      switch (filters.dateRange) {
        case 'hoje':
          if (!due || !isToday(due)) continue;
          break;
        case 'semana':
          if (!due || !isThisWeek(due, { weekStartsOn: 1 })) continue;
          break;
        case 'atrasado':
          if (!due || !isPast(startOfDay(due)) || isToday(due)) continue;
          break;
        case 'futuro':
          if (!due || !isFuture(startOfDay(due))) continue;
          break;
      }
    }

    // Text search (title + notes + tags)
    if (q) {
      const titleNorm = normalize(item.title);
      const notesNorm = item.notes ? normalize(item.notes) : '';
      const tagsNorm = item.tags?.map(normalize).join(' ') || '';

      let score = 0;
      let matchField: SearchResult['matchField'] = 'title';

      // Title exact start = highest
      if (titleNorm.startsWith(q)) {
        score = 100;
      } else if (titleNorm.includes(q)) {
        score = 80;
      } else if (notesNorm.includes(q)) {
        score = 50;
        matchField = 'notes';
      } else if (tagsNorm.includes(q)) {
        score = 40;
        matchField = 'tag';
      } else {
        continue; // No match
      }

      results.push({ item, score, matchField });
    } else {
      // No text query — all non-filtered items match
      results.push({ item, score: 50, matchField: 'title' });
    }
  }

  // Sort by score descending, then by title
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.title.localeCompare(b.item.title);
  });

  return results;
}

/**
 * Check if any advanced filters are active.
 */
export function hasActiveFilters(filters: SearchFilters): boolean {
  return !!(
    filters.module ||
    filters.emotion ||
    filters.period ||
    filters.priority ||
    filters.type ||
    filters.tag ||
    filters.dateRange
  );
}

/**
 * Get human-readable labels for active filters (PT-BR).
 */
export function getFilterLabels(filters: SearchFilters): { key: string; label: string; color: string }[] {
  const labels: { key: string; label: string; color: string }[] = [];

  if (filters.module) {
    const m = MODULES.find((mod) => mod.key === filters.module);
    if (m) labels.push({ key: 'module', label: m.label, color: m.color });
  }
  if (filters.emotion) {
    labels.push({ key: 'emotion', label: filters.emotion, color: '#c4a882' });
  }
  if (filters.period) {
    const p = RITUAL_PERIODS.find((rp) => rp.key === filters.period);
    if (p) labels.push({ key: 'period', label: p.label, color: p.color });
  }
  if (filters.priority) {
    const pl: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baixa' };
    labels.push({ key: 'priority', label: pl[filters.priority] || filters.priority, color: '#a89478' });
  }
  if (filters.type) {
    labels.push({ key: 'type', label: filters.type, color: '#a89478' });
  }
  if (filters.tag) {
    labels.push({ key: 'tag', label: `#${filters.tag}`, color: '#a89478' });
  }
  if (filters.dateRange) {
    const dl: Record<string, string> = { hoje: 'Hoje', semana: 'Semana', atrasado: 'Atrasado', futuro: 'Futuro' };
    labels.push({ key: 'dateRange', label: dl[filters.dateRange] || filters.dateRange, color: '#a89478' });
  }

  return labels;
}

/**
 * Extract all unique tags from items.
 */
export function extractTags(items: AtomItem[]): string[] {
  const tagSet = new Set<string>();
  for (const item of items) {
    if (item.tags) {
      for (const tag of item.tags) {
        tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet).sort();
}
