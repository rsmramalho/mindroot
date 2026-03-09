// engine/parsing.ts — Parsing Engine v2
// Lógica pura, zero side effects, totalmente testável

import type { ParsedInput, DetectedToken, TokenType } from '@/types/engine';
import type { Emotion, ItemType, ItemModule, ItemPriority, RitualPeriod } from '@/types/item';
import { addDays, nextMonday, format } from 'date-fns';

// ─── Token patterns ─────────────────────────────────────────

const TOKEN_PATTERNS: { regex: RegExp; type: TokenType; extract: (m: RegExpMatchArray) => string }[] = [
  // Módulos: #mod_work, #mod_family, etc.
  { regex: /#mod_(purpose|work|family|body|mind|soul)\b/gi, type: 'module', extract: m => m[1].toLowerCase() },

  // Prioridade: #prio_urgente, etc.
  { regex: /#prio_(urgente|importante|manutencao|futuro)\b/gi, type: 'priority', extract: m => m[1].toLowerCase() },

  // Emoção pré: #emo_calmo
  { regex: /#emo_(calmo|focado|grato|animado|confiante|ansioso|cansado|frustrado|triste|perdido|neutro)\b/gi, type: 'emotion_before', extract: m => m[1].toLowerCase() },

  // Emoção pós: #emob_grato
  { regex: /#emob_(calmo|focado|grato|animado|confiante|ansioso|cansado|frustrado|triste|perdido|neutro)\b/gi, type: 'emotion_after', extract: m => m[1].toLowerCase() },

  // Tipo explícito: #type_habit, #type_note, #type_project
  { regex: /#type_(task|habit|ritual|chore|project|note|reflection|journal)\b/gi, type: 'type', extract: m => m[1].toLowerCase() },

  // Chore
  { regex: /#chore\b/gi, type: 'chore', extract: () => 'true' },

  // Needs check-in
  { regex: /#needs_checkin\b/gi, type: 'needs_checkin', extract: () => 'true' },

  // Energy cost: #energy_1 through #energy_5
  { regex: /#energy_([1-5])\b/gi, type: 'energy', extract: m => m[1] },

  // Temporal: @hoje, @amanha, @semana
  { regex: /@(hoje|amanha|amanhã|semana|ritual|checkin)\b/gi, type: 'temporal', extract: m => m[1].toLowerCase().replace('ã', 'a') },

  // Temporal: "as 14:30" or "às 14h" or "as 9"
  { regex: /[àa]s?\s*(\d{1,2})(?::(\d{2}))?(?:h(?:oras?)?)?\b/gi, type: 'temporal', extract: m => `time:${m[1].padStart(2, '0')}:${m[2] || '00'}` },

  // Library and docs
  { regex: /#lib_(\w+)\b/gi, type: 'library', extract: m => m[1].toLowerCase() },
  { regex: /#doc_(\w+)\b/gi, type: 'document', extract: m => m[1].toLowerCase() },
];

// ─── Main parse function ────────────────────────────────────

export function parseInput(raw: string): ParsedInput {
  const tokens: DetectedToken[] = [];
  let cleaned = raw;

  // Extract all tokens
  for (const pattern of TOKEN_PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(raw)) !== null) {
      tokens.push({
        raw: match[0],
        type: pattern.type,
        value: pattern.extract(match),
        position: match.index,
      });
      cleaned = cleaned.replace(match[0], '');
    }
  }

  // Clean up title
  const title = cleaned.replace(/\s+/g, ' ').trim();

  // Derive fields from tokens
  const moduleToken = tokens.find(t => t.type === 'module');
  const priorityToken = tokens.find(t => t.type === 'priority');
  const emotionBeforeToken = tokens.find(t => t.type === 'emotion_before');
  const emotionAfterToken = tokens.find(t => t.type === 'emotion_after');
  const typeToken = tokens.find(t => t.type === 'type');
  const choreToken = tokens.find(t => t.type === 'chore');
  const checkinToken = tokens.find(t => t.type === 'needs_checkin');
  const energyToken = tokens.find(t => t.type === 'energy');
  const temporalTokens = tokens.filter(t => t.type === 'temporal');

  // Resolve temporal
  const { due_date, due_time, ritual_period } = resolveTemporal(temporalTokens);

  // Resolve type
  const is_chore = !!choreToken;
  let type: ItemType = 'task'; // default
  if (typeToken) {
    type = typeToken.value as ItemType;
  } else if (is_chore) {
    type = 'chore';
  } else if (ritual_period) {
    type = 'ritual';
  }

  // Needs check-in: explicit OR chore always triggers
  const needs_checkin = !!checkinToken || is_chore;

  // Collect non-system tags (anything starting with # that wasn't matched)
  const tagRegex = /#(\w+)\b/g;
  const allTags: string[] = [];
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRegex.exec(raw)) !== null) {
    const isSystemToken = tokens.some(t => t.raw === tagMatch![0]);
    if (!isSystemToken) {
      allTags.push(tagMatch[1]);
    }
  }

  return {
    title,
    type,
    module: moduleToken ? (moduleToken.value as ItemModule) : null,
    priority: priorityToken ? (priorityToken.value as ItemPriority) : null,
    emotion_before: emotionBeforeToken ? (emotionBeforeToken.value as Emotion) : null,
    emotion_after: emotionAfterToken ? (emotionAfterToken.value as Emotion) : null,
    needs_checkin,
    is_chore,
    energy_cost: energyToken ? parseInt(energyToken.value, 10) : null,
    due_date,
    due_time,
    ritual_period,
    tags: allTags,
    tokens,
    context: raw,
  };
}

// ─── Temporal resolver ──────────────────────────────────────

function resolveTemporal(tokens: DetectedToken[]): {
  due_date: string | null;
  due_time: string | null;
  ritual_period: RitualPeriod | null;
} {
  let due_date: string | null = null;
  let due_time: string | null = null;
  let ritual_period: RitualPeriod | null = null;
  const today = new Date();

  for (const token of tokens) {
    const val = token.value;

    if (val === 'hoje') {
      due_date = format(today, 'yyyy-MM-dd');
    } else if (val === 'amanha') {
      due_date = format(addDays(today, 1), 'yyyy-MM-dd');
    } else if (val === 'semana') {
      due_date = format(nextMonday(today), 'yyyy-MM-dd');
    } else if (val === 'ritual') {
      const hour = today.getHours();
      if (hour >= 5 && hour < 12) ritual_period = 'aurora';
      else if (hour >= 12 && hour < 18) ritual_period = 'zenite';
      else ritual_period = 'crepusculo';
    } else if (val.startsWith('time:')) {
      due_time = val.replace('time:', '');
      if (!due_date) {
        due_date = format(today, 'yyyy-MM-dd');
      }
    }
  }

  return { due_date, due_time, ritual_period };
}
