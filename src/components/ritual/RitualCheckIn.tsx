// components/ritual/RitualCheckIn.tsx — Period check-in
// Appears when all rituals in a period are done (or manually)
// Emotion pick + free-form reflection → saves journal entry

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Emotion, RitualSlot } from '@/types/item';
import { useItemMutations } from '@/hooks/useItemMutations';
import { useAppStore } from '@/store/app-store';
import { useRitualStore } from '@/store/ritual-store';
import EmotionPicker from '@/components/soul/EmotionPicker';

interface RitualCheckInProps {
  period: RitualSlot;
  periodColor: string;
  prompt: string;
  isPeriodComplete: boolean;
}

type Phase = 'idle' | 'emotion' | 'writing' | 'done';

export default function RitualCheckIn({
  period,
  periodColor,
  prompt,
  isPeriodComplete,
}: RitualCheckInProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);

  const { createItem } = useItemMutations();
  const user = useAppStore((s) => s.user);
  const setCurrentEmotion = useAppStore((s) => s.setCurrentEmotion);
  const { closeCheckIn } = useRitualStore();

  const handleEmotionSelect = useCallback((emotion: Emotion) => {
    setSelectedEmotion(emotion);
    setPhase('writing');
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || !selectedEmotion) return;
    setSaving(true);

    const periodLabel = period === 'aurora' ? 'Aurora' : period === 'zenite' ? 'Zenite' : 'Crepusculo';
    const title = reflection.trim()
      ? reflection.trim().slice(0, 120)
      : `Reflexao ${periodLabel} — ${selectedEmotion}`;

    try {
      await createItem.mutateAsync({
        user_id: user.id,
        title,
        type: 'log',
        module: 'mind',
        body: {
          soul: {
            emotion_after: selectedEmotion,
            emotion_before: null,
            energy_level: null,
            needs_checkin: false,
            ritual_slot: period,
          },
        },
        tags: ['ritual_checkin', period],
        notes: reflection.trim() || null,
      });

      setCurrentEmotion(selectedEmotion);
      setPhase('done');
    } catch {
      // Silently handle — optimistic UI will show it anyway
    } finally {
      setSaving(false);
    }
  }, [user, selectedEmotion, reflection, period, createItem, setCurrentEmotion]);

  const handleReset = useCallback(() => {
    setPhase('idle');
    setSelectedEmotion(null);
    setReflection('');
    closeCheckIn();
  }, [closeCheckIn]);

  return (
    <div
      className="overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: '#1a1d24',
        borderRadius: '16px',
        border: `1px solid ${periodColor}20`,
      }}
    >
      <AnimatePresence mode="wait">
        {/* ━━━ Idle: invitation to check in ━━━ */}
        {phase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5"
          >
            {isPeriodComplete && (
              <div
                className="mb-3"
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: periodColor,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                periodo completo
              </div>
            )}

            <p
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '20px',
                fontWeight: 300,
                color: '#e8e0d4',
                lineHeight: 1.35,
                letterSpacing: '-0.02em',
              }}
            >
              {prompt}
            </p>

            <button
              onClick={() => setPhase('emotion')}
              className="mt-4 w-full transition-all duration-200"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: periodColor,
                backgroundColor: periodColor + '15',
                border: `1px solid ${periodColor}30`,
                borderRadius: '10px',
                padding: '12px 20px',
              }}
            >
              Iniciar reflexao
            </button>
          </motion.div>
        )}

        {/* ━━━ Emotion: pick current emotion ━━━ */}
        {phase === 'emotion' && (
          <motion.div
            key="emotion"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-5"
          >
            <EmotionPicker
              selected={selectedEmotion}
              onSelect={handleEmotionSelect}
              label="Como você se sente agora?"
            />

            <button
              onClick={() => setPhase('idle')}
              className="mt-3"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#a8947840',
              }}
            >
              ← voltar
            </button>
          </motion.div>
        )}

        {/* ━━━ Writing: free-form reflection ━━━ */}
        {phase === 'writing' && (
          <motion.div
            key="writing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-5"
          >
            {/* Selected emotion display */}
            {selectedEmotion && (
              <div
                className="mb-3"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: periodColor,
                  fontWeight: 500,
                }}
              >
                {selectedEmotion}
              </div>
            )}

            <p
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '16px',
                fontWeight: 300,
                color: '#e8e0d4',
                marginBottom: '12px',
              }}
            >
              {prompt}
            </p>

            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Escreva livremente..."
              autoFocus
              rows={4}
              className="w-full resize-none outline-none transition-colors"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#e8e0d4',
                backgroundColor: '#111318',
                border: '1px solid #a8947815',
                borderRadius: '10px',
                padding: '12px',
                lineHeight: 1.6,
              }}
            />

            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 transition-all duration-200"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: periodColor,
                  backgroundColor: periodColor + '15',
                  border: `1px solid ${periodColor}30`,
                  borderRadius: '10px',
                  padding: '12px 20px',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? 'Salvando...' : 'Salvar reflexao'}
              </button>
              <button
                onClick={() => {
                  setPhase('emotion');
                  setReflection('');
                }}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: '#a8947840',
                  padding: '12px',
                }}
              >
                ← voltar
              </button>
            </div>
          </motion.div>
        )}

        {/* ━━━ Done: confirmation ━━━ */}
        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 text-center"
          >
            <div
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '28px',
                fontWeight: 300,
                color: periodColor,
                marginBottom: '8px',
              }}
            >
              ◎
            </div>
            <p
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '18px',
                fontWeight: 400,
                color: '#e8e0d4',
                marginBottom: '4px',
              }}
            >
              Reflexao salva
            </p>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#a8947860',
                marginBottom: '16px',
              }}
            >
              {selectedEmotion} — registrado no journal
            </p>
            <button
              onClick={handleReset}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#a89478',
                backgroundColor: '#a8947812',
                border: '1px solid #a8947820',
                borderRadius: '10px',
                padding: '10px 24px',
              }}
            >
              Fechar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
