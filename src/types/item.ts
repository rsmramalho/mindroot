// types/item.ts — Atom Engine Schema v2
// Zero imports. Pure types.
// Reference: Genesis v4.2 + AtomItem Schema v2

// ═══════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════

export type AtomState =
  | 'inbox'       // Stage 1 · Point
  | 'classified'  // Stage 2 — Line
  | 'structured'  // Stage 3 △ Triangle
  | 'validated'   // Stage 4 □ Square
  | 'connected'   // Stage 5 ⬠ Pentagon
  | 'propagated'  // Stage 6 ⬡ Hexagon
  | 'committed'   // Stage 7 ○ Circle
  | 'archived';   // Entropy

export type AtomType =
  | 'note' | 'reflection' | 'recommendation' | 'podcast' | 'article'
  | 'resource' | 'list' | 'task' | 'habit' | 'recipe' | 'workout'
  | 'spec' | 'checkpoint' | 'project' | 'session-log' | 'wrap'
  | 'ritual' | 'review' | 'log' | 'doc' | 'research' | 'template' | 'lib';

export type AtomModule =
  | 'work' | 'body' | 'mind' | 'family'
  | 'purpose' | 'bridge' | 'finance' | 'social';

export type AtomStatus =
  | 'inbox' | 'draft' | 'active' | 'paused'
  | 'waiting' | 'someday' | 'completed' | 'archived';

export type AtomRelation =
  | 'belongs_to' | 'blocks' | 'feeds' | 'mirrors'
  | 'derives' | 'references' | 'morphed_from' | 'extracted_from';

export type AtomSource =
  | 'claude-project' | 'claude-chat' | 'claude-chrome' | 'claude-code'
  | 'mindroot' | 'constellation' | 'obsidian' | 'drive'
  | 'monday' | 'manual' | 'atom-engine';

export type RitualSlot = 'aurora' | 'zenite' | 'crepusculo';

export type EnergyLevel = 'high' | 'medium' | 'low';

export type Priority = 'high' | 'medium' | 'low';

// ═══════════════════════════════════════════
// CORE INTERFACE
// ═══════════════════════════════════════════

export interface AtomItem {
  id: string;
  user_id: string;

  // Classification (stage 2+)
  title: string;
  type: AtomType | null;
  module: AtomModule | null;
  tags: string[];
  status: AtomStatus;

  // State machine (stage 1+)
  state: AtomState;
  genesis_stage: number; // 1-7

  // Hierarchy (stage 4+)
  project_id: string | null;
  naming_convention: string | null;

  // Content (stage 3+)
  notes: string | null;
  body: AtomBody;

  // Meta
  source: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// ═══════════════════════════════════════════
// BODY + EXTENSIONS
// ═══════════════════════════════════════════

export interface AtomBody {
  // Type-specific fields (varies by type — see Type Registry)
  [key: string]: unknown;

  // Extensions (opt-in)
  soul?: SoulExtension;
  operations?: OperationsExtension;
  recurrence?: RecurrenceExtension;
}

export interface SoulExtension {
  energy_level: EnergyLevel | null;
  emotion_before: string | null;
  emotion_after: string | null;
  needs_checkin: boolean;
  ritual_slot: RitualSlot | null;
}

export interface OperationsExtension {
  priority: Priority | null;
  deadline: string | null;       // ISO-8601
  due_date: string | null;       // YYYY-MM-DD
  project_status: 'draft' | 'active' | 'paused' | 'completed' | 'archived' | null;
  progress_mode: 'auto' | 'milestone' | 'manual' | null;
  progress: number | null;       // 0-100
}

export interface RecurrenceExtension {
  rule: string | null;           // RRULE (iCalendar RFC 5545)
  last_completed: string | null; // ISO-8601
  streak_count: number;
  completion_log: string[];      // Array of ISO timestamps
}

// ═══════════════════════════════════════════
// CONNECTIONS (item_connections table)
// ═══════════════════════════════════════════

export interface ItemConnection {
  id: string;
  user_id: string;
  source_id: string;
  target_id: string;
  relation: AtomRelation;
  note: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════
// EVENTS (atom_events table)
// ═══════════════════════════════════════════

export interface AtomEvent {
  id: string;
  user_id: string;
  source_id: string;
  target_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

// ═══════════════════════════════════════════
// PAYLOADS
// ═══════════════════════════════════════════

export type CreateItemPayload = Pick<AtomItem, 'title' | 'user_id'> &
  Partial<Omit<AtomItem, 'id' | 'created_at' | 'updated_at' | 'title' | 'user_id'>>;

export type UpdateItemPayload = Partial<Omit<AtomItem, 'id' | 'user_id' | 'created_at'>>;

export type CreateConnectionPayload = Pick<ItemConnection, 'source_id' | 'target_id' | 'relation'> &
  Partial<Pick<ItemConnection, 'note'>>;

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

export const MODULES: { key: AtomModule; label: string; color: string }[] = [
  { key: 'work',    label: 'Trabalho',  color: '#8a9e7a' },
  { key: 'body',    label: 'Corpo',     color: '#b8c4a8' },
  { key: 'mind',    label: 'Mente',     color: '#a89478' },
  { key: 'family',  label: 'Família',   color: '#d4856a' },
  { key: 'purpose', label: 'Propósito', color: '#c4a882' },
  { key: 'bridge',  label: 'Ponte',     color: '#8a8a8a' },
  { key: 'finance', label: 'Finanças',  color: '#7a9e8a' },
  { key: 'social',  label: 'Social',    color: '#9e7a8a' },
];

export const EMOTIONS = [
  'calmo', 'focado', 'grato', 'animado', 'confiante',
  'ansioso', 'cansado', 'frustrado', 'triste', 'perdido',
  'neutro',
] as const;

export type Emotion = (typeof EMOTIONS)[number];

export const POSITIVE_EMOTIONS: Emotion[] = ['calmo', 'focado', 'grato', 'animado', 'confiante'];
export const CHALLENGING_EMOTIONS: Emotion[] = ['ansioso', 'cansado', 'frustrado', 'triste', 'perdido'];

export const GENESIS_STAGES = [
  { stage: 1, geometry: '·', name: 'Ponto',     label: 'Captura' },
  { stage: 2, geometry: '—', name: 'Linha',     label: 'Intenção' },
  { stage: 3, geometry: '△', name: 'Triângulo', label: 'Estrutura' },
  { stage: 4, geometry: '□', name: 'Quadrado',  label: 'Fundação' },
  { stage: 5, geometry: '⬠', name: 'Pentágono', label: 'Conexão' },
  { stage: 6, geometry: '⬡', name: 'Hexágono',  label: 'Ativação' },
  { stage: 7, geometry: '○', name: 'Círculo',   label: 'Completude' },
] as const;

export const TYPE_FLOORS: Record<AtomType, number> = {
  'note': 2, 'reflection': 2, 'recommendation': 2, 'podcast': 2, 'article': 2,
  'resource': 2, 'list': 2,
  'task': 3, 'habit': 3, 'recipe': 3, 'workout': 3, 'checkpoint': 3,
  'spec': 5, 'project': 5,
  'session-log': 7, 'wrap': 7,
  'ritual': 3, 'review': 3, 'log': 2, 'doc': 2, 'research': 2, 'template': 3, 'lib': 2,
};
