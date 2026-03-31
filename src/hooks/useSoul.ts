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
    const trigger = shouldTriggerCheckIn({ ...item, status: 'completed' });
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
    (emotion: Emotion) => {
      if (!checkIn.item || !checkIn.trigger) return;

      const shift = detectShift((checkIn.item.body.soul?.emotion_before as Emotion | undefined) ?? null, emotion);

      // Set result state FIRST — before mutations trigger re-renders
      const item = checkIn.item;
      setCheckIn((prev) => ({
        ...prev,
        phase: 'result',
        emotionAfter: emotion,
        shift,
      }));

      // Then fire mutations (these trigger query invalidation + re-renders)
      updateMutation.mutate({
        id: item.id,
        updates: {
          body: {
            ...item.body,
            soul: {
              energy_level: item.body.soul?.energy_level ?? null,
              emotion_before: item.body.soul?.emotion_before ?? null,
              emotion_after: emotion,
              needs_checkin: item.body.soul?.needs_checkin ?? false,
              ritual_slot: item.body.soul?.ritual_slot ?? null,
            },
          },
        },
      });

      // Criar reflection automatica
      const reflectionTitle = buildReflectionTitle(item, emotion, shift);

      createItem.mutate({
        user_id: item.user_id,
        title: reflectionTitle,
        type: 'reflection',
        module: item.module,
        body: {
          soul: {
            energy_level: null,
            emotion_before: item.body.soul?.emotion_before ?? null,
            emotion_after: emotion,
            needs_checkin: false,
            ritual_slot: null,
          },
        },
        tags: ['auto_checkin'],
        notes: `Check-in apos: ${item.title}`,
      });
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

// --- Helper -----------------------------------------------------------

function buildReflectionTitle(
  item: AtomItem,
  emotionAfter: Emotion,
  shift: EmotionalShift
): string {
  if (item.tags.includes('chore')) {
    return `Trabalho invisivel: ${item.title} -> ${emotionAfter}`;
  }

  const emotionBefore = item.body.soul?.emotion_before;
  switch (shift) {
    case 'positive':
      return `-> ${emotionBefore} -> ${emotionAfter} | ${item.title}`;
    case 'negative':
      return `<- ${emotionBefore} -> ${emotionAfter} | ${item.title}`;
    case 'stable':
      return `= ${emotionAfter} | ${item.title}`;
    default:
      return `Check-in: ${emotionAfter} | ${item.title}`;
  }
}
