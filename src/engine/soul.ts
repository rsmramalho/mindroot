// engine/soul.ts — Soul Engine
// Check-in triggers, contextual prompts, emotional shift detection
// Fase 2: expanded triggers (chore, emotion_before, ritual)

import type { AtomItem, Emotion, SoulExtension } from '@/types/item';
import type { CheckInTrigger } from '@/types/engine';
import { POSITIVE_EMOTIONS, CHALLENGING_EMOTIONS } from '@/types/item';

// ─── Helpers ────────────────────────────────────────────────

function getEmotionBefore(item: AtomItem): Emotion | null {
  const val = (item.body?.soul as SoulExtension | undefined)?.emotion_before;
  return (val as Emotion) ?? null;
}

function getNeedsCheckin(item: AtomItem): boolean {
  return (item.body?.soul as SoulExtension | undefined)?.needs_checkin ?? false;
}

function isChore(item: AtomItem): boolean {
  return item.tags?.includes('chore') || item.tags?.includes('#chore') || false;
}

// ─── Check-in trigger logic ─────────────────────────────────
// Triggers quando:
// 1. needs_checkin explícito
// 2. is_chore (sempre reconhece trabalho invisível)
// 3. tem emotion_before (verifica shift)
// 4. type === 'ritual'

export function shouldTriggerCheckIn(item: AtomItem): CheckInTrigger | null {
  if (item.status !== 'completed') return null;

  const emotionBefore = getEmotionBefore(item);
  const itemIsChore = isChore(item);

  // Rule 1: explicit needs_checkin
  if (getNeedsCheckin(item)) {
    return {
      item_id: item.id,
      reason: itemIsChore ? 'chore_complete' : 'task_complete',
      emotion_before: emotionBefore,
      prompt: generatePrompt(item),
    };
  }

  // Rule 2: chores always get recognized
  if (itemIsChore) {
    return {
      item_id: item.id,
      reason: 'chore_complete',
      emotion_before: emotionBefore,
      prompt: generatePrompt(item),
    };
  }

  // Rule 3: has emotion_before — check for shift
  if (emotionBefore) {
    return {
      item_id: item.id,
      reason: 'task_complete',
      emotion_before: emotionBefore,
      prompt: generatePrompt(item),
    };
  }

  // Rule 4: ritual tasks
  if (item.type === 'ritual') {
    return {
      item_id: item.id,
      reason: 'task_complete',
      emotion_before: null,
      prompt: generatePrompt(item),
    };
  }

  return null;
}

// ─── Contextual prompt generation ───────────────────────────

function generatePrompt(item: AtomItem): string {
  const emotionBefore = getEmotionBefore(item);
  const itemIsChore = isChore(item);
  const { type } = item;

  // Chore complete
  if (itemIsChore) {
    return 'Trabalho invisível reconhecido. Como você se sente depois?';
  }

  // Had challenging emotion before
  if (emotionBefore && CHALLENGING_EMOTIONS.includes(emotionBefore)) {
    return `Você estava ${emotionBefore} antes. Como se sente agora?`;
  }

  // Had positive emotion before
  if (emotionBefore && POSITIVE_EMOTIONS.includes(emotionBefore)) {
    return `Começou ${emotionBefore}. Algo mudou?`;
  }

  // Had neutral emotion
  if (emotionBefore) {
    return `Estava ${emotionBefore}. E agora?`;
  }

  // Ritual
  if (type === 'ritual') {
    return 'Como foi esse momento de ritual?';
  }

  // Default
  return 'Como você se sente agora?';
}

// ─── Emotional shift detection ──────────────────────────────

export type EmotionalShift = 'positive' | 'negative' | 'stable' | 'unknown';

export function detectShift(before: Emotion | null, after: Emotion | null): EmotionalShift {
  if (!before || !after) return 'unknown';
  if (before === after) return 'stable';

  const beforePositive = POSITIVE_EMOTIONS.includes(before);
  const afterPositive = POSITIVE_EMOTIONS.includes(after);

  if (!beforePositive && afterPositive) return 'positive';
  if (beforePositive && !afterPositive) return 'negative';

  return 'stable';
}

// ─── Ritual period prompts ──────────────────────────────────

export const PERIOD_PROMPTS = {
  aurora: [
    'O que traria clareza para o dia de hoje?',
    'Qual intenção guia sua manhã?',
    'Uma coisa que você quer honrar hoje:',
  ],
  zenite: [
    'Como está sendo o dia até aqui?',
    'O que merece sua atenção agora?',
    'Pause. Respire. O que importa neste momento?',
  ],
  crepusculo: [
    'O que trouxe significado ao seu dia?',
    'Algo que você aprendeu sobre si hoje:',
    'Gratidão do dia:',
  ],
} as const;

export function getRandomPrompt(period: keyof typeof PERIOD_PROMPTS): string {
  const prompts = PERIOD_PROMPTS[period];
  return prompts[Math.floor(Math.random() * prompts.length)];
}
