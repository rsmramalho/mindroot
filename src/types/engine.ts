// types/engine.ts — Parsing Engine + Soul Engine types
import type { Emotion, ItemType, ItemModule, ItemPriority, RitualPeriod } from './item';

export type TokenType =
  | 'module' | 'priority' | 'emotion_before' | 'emotion_after'
  | 'type' | 'chore' | 'needs_checkin' | 'temporal' | 'energy'
  | 'ritual' | 'context' | 'library' | 'document' | 'unknown';

export interface DetectedToken {
  raw: string;           // texto original: "#mod_work"
  type: TokenType;
  value: string;         // valor limpo: "work"
  position: number;      // índice no input
}

export interface ParsedInput {
  title: string;                       // texto limpo, sem tokens
  type: ItemType;
  module: ItemModule | null;
  priority: ItemPriority | null;
  emotion_before: Emotion | null;
  emotion_after: Emotion | null;
  needs_checkin: boolean;
  is_chore: boolean;
  due_date: string | null;             // ISO string
  due_time: string | null;             // HH:mm
  ritual_period: RitualPeriod | null;
  energy_cost: number | null;          // 1-5
  tags: string[];                      // tags não-sistema
  tokens: DetectedToken[];             // todos os tokens detectados
  context: string;                     // input original preservado
}

export interface CheckInTrigger {
  item_id: string;
  reason: 'task_complete' | 'chore_complete' | 'ritual_period_end' | 'project_complete' | 'manual';
  emotion_before: Emotion | null;
  prompt: string;
}

export interface EngineLogEntry {
  timestamp: string;
  action: string;
  input?: string;
  output?: unknown;
  duration_ms?: number;
}
