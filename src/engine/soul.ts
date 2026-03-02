// engine/soul.ts — Soul Engine
// Check-in triggers, contextual prompts, emotional shift detection
// Fase 2: expanded triggers (chore, emotion_before, ritual)

import type { AtomItem, Emotion } from '@/types/item';
import type { CheckInTrigger } from '@/types/engine';
import { POSITIVE_EMOTIONS, CHALLENGING_EMOTIONS } from '@/types/item';

// ─── Check-in trigger logic ─────────────────────────────────
// Triggers quando:
// 1. needs_checkin explícito
// 2. is_chore (sempre reconhece trabalho invisível)
// 3. tem emotion_before (verifica shift)
// 4. type === 'ritual'

export function shouldTriggerCheckIn(item: AtomItem): CheckInTrigger | null {
  if (!item.completed) return null;

  // Rule 1: explicit needs_checkin
  if (item.needs_checkin) {
    return {
      item_id: item.id,
      reason: item.is_chore ? 'chore_complete' : 'task_complete',
      emotion_before: item.emotion_before,
      prompt: generatePrompt(item),
    };
  }

  // Rule 2: chores always get recognized
  if (item.is_chore) {
    return {
      item_id: item.id,
      reason: 'chore_complete',
      emotion_before: item.emotion_before,
      prompt: generatePrompt(item),
    };
  }

  // Rule 3: has emotion_before — check for shift
  if (item.emotion_before) {
    return {
      item_id: item.id,
      reason: 'task_complete',
      emotion_before: item.emotion_before,
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
  const { emotion_before, is_chore, type } = item;

  // Chore complete
  if (is_chore) {
    return 'Trabalho invisível reconhecido. Como você se sente depois?';
  }

  // Had challenging emotion before
  if (emotion_before && CHALLENGING_EMOTIONS.includes(emotion_before)) {
    return `Você estava ${emotion_before} antes. Como se sente agora?`;
  }

  // Had positive emotion before
  if (emotion_before && POSITIVE_EMOTIONS.includes(emotion_before)) {
    return `Começou ${emotion_before}. Algo mudou?`;
  }

  // Had neutral emotion
  if (emotion_before) {
    return `Estava ${emotion_before}. E agora?`;
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
