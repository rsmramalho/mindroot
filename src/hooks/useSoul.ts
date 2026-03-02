// hooks/useSoul.ts — Soul Layer state + check-in flow
// Fase 2: gerencia fluxo completo de check-in emocional

import { useState, useCallback } from 'react';
import { shouldTriggerCheckIn, detectShift } from '@/engine/soul';
import { useItemMutations } from '@/hooks/useItemMutations';
import type { AtomItem, Emotion } from '@/types/item';
import type { CheckInTrigger } from '@/types/engine';
import type { EmotionalShift } from '@/engine/soul';

export interface CheckInState {
  active: boolean;
  trigger: CheckInTrigger | null;
  item: AtomItem | null;
  phase: 'prompt' | 'picking' | 'result';
  emotionAfter: Emotion | null;
  shift: EmotionalShift;
}

const INITIAL_STATE: CheckInState = {
  active: false,
  trigger: null,
  item: null,
  phase: 'prompt',
  emotionAfter: null,
  shift: 'unknown',
};

export function useSoul() {
  const [checkIn, setCheckIn] = useState<CheckInState>(INITIAL_STATE);
  const { updateMutation, createItem } = useItemMutations();

  // Chamado quando user completa um item
  const onItemComplete = useCallback((item: AtomItem) => {
    const trigger = shouldTriggerCheckIn({ ...item, completed: true });
    if (trigger) {
      setCheckIn({
        active: true,
        trigger,
        item,
        phase: 'prompt',
        emotionAfter: null,
        shift: 'unknown',
      });
    }
  }, []);

  // User aceita fazer check-in → mostra emotion picker
  const startPicking = useCallback(() => {
    setCheckIn((prev) => ({ ...prev, phase: 'picking' }));
  }, []);

  // User seleciona emoção pós → salva e mostra resultado
  const selectEmotion = useCallback(
    async (emotion: Emotion) => {
      if (!checkIn.item || !checkIn.trigger) return;

      const shift = detectShift(checkIn.item.emotion_before, emotion);

      // Salvar emotion_after no item
      updateMutation.mutate({
        id: checkIn.item.id,
        updates: { emotion_after: emotion },
      });

      // Criar reflection automática
      const user_id = checkIn.item.user_id;
      const reflectionTitle = buildReflectionTitle(checkIn.item, emotion, shift);

      createItem.mutate({
        user_id,
        title: reflectionTitle,
        type: 'reflection',
        module: checkIn.item.module,
        emotion_before: checkIn.item.emotion_before,
        emotion_after: emotion,
        tags: ['auto_checkin'],
        context: `Check-in após: ${checkIn.item.title}`,
      });

      setCheckIn((prev) => ({
        ...prev,
        phase: 'result',
        emotionAfter: emotion,
        shift,
      }));
    },
    [checkIn.item, checkIn.trigger, updateMutation, createItem]
  );

  // User pula o check-in
  const skip = useCallback(() => {
    setCheckIn(INITIAL_STATE);
  }, []);

  // Fechar resultado
  const dismiss = useCallback(() => {
    setCheckIn(INITIAL_STATE);
  }, []);

  return {
    checkIn,
    onItemComplete,
    startPicking,
    selectEmotion,
    skip,
    dismiss,
  };
}

// ─── Helper ───────────────────────────────────────────────

function buildReflectionTitle(
  item: AtomItem,
  emotionAfter: Emotion,
  shift: EmotionalShift
): string {
  if (item.is_chore) {
    return `Trabalho invisível: ${item.title} → ${emotionAfter}`;
  }

  switch (shift) {
    case 'positive':
      return `↑ ${item.emotion_before} → ${emotionAfter} | ${item.title}`;
    case 'negative':
      return `↓ ${item.emotion_before} → ${emotionAfter} | ${item.title}`;
    case 'stable':
      return `= ${emotionAfter} | ${item.title}`;
    default:
      return `Check-in: ${emotionAfter} | ${item.title}`;
  }
}
