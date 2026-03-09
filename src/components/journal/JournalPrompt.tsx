// components/journal/JournalPrompt.tsx — New journal entry writer
// Prompted writing with emotion selection, saves to DB

import { useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Emotion } from '@/types/item';
import { useItemMutations } from '@/hooks/useItemMutations';
import { useAppStore } from '@/store/app-store';
import { useRitualStore } from '@/store/ritual-store';
import { getRandomPrompt } from '@/engine/soul';
import EmotionPicker from '@/components/soul/EmotionPicker';

export interface JournalPromptHandle {
  open: () => void;
}

const JournalPrompt = forwardRef<JournalPromptHandle>(function JournalPrompt(_props, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const { createItem } = useItemMutations();
  const user = useAppStore((s) => s.user);
  const { currentPeriod, periodColor } = useRitualStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prompt = useMemo(() => getRandomPrompt(currentPeriod), [currentPeriod]);

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
  }));

  const handleSave = useCallback(async () => {
    if (!user || !text.trim()) return;
    setSaving(true);

    const title = text.trim().slice(0, 120);

    try {
      await createItem.mutateAsync({
        user_id: user.id,
        title,
        type: 'journal',
        module: 'soul',
        emotion_after: emotion,
        tags: ['manual'],
        description: text.trim().length > 120 ? text.trim() : null,
        context: 'Entrada manual — journal',
      });

      // Reset
      setText('');
      setEmotion(null);
      setIsOpen(false);
      setShowEmotionPicker(false);
    } catch {
      // Silently handle
    } finally {
      setSaving(false);
    }
  }, [user, text, emotion, createItem]);

  return (
    <div>
      {/* ━━━ Trigger button ━━━ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-full text-left transition-all duration-200"
            style={{
              backgroundColor: '#1a1d24',
              borderRadius: '12px',
              border: '1px dashed #a8947825',
              padding: '16px',
            }}
          >
            <span
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '16px',
                fontWeight: 300,
                color: '#a8947860',
                letterSpacing: '-0.01em',
              }}
            >
              {prompt}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ━━━ Writing area ━━━ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            style={{
              backgroundColor: '#1a1d24',
              borderRadius: '12px',
              border: `1px solid ${periodColor}20`,
            }}
          >
            <div className="p-4 space-y-3">
              {/* Prompt label */}
              <p
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: '15px',
                  fontWeight: 300,
                  color: '#e8e0d490',
                }}
              >
                {prompt}
              </p>

              {/* Text input */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva aqui..."
                autoFocus
                rows={5}
                className="w-full resize-none outline-none"
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

              {/* Emotion picker toggle */}
              <AnimatePresence>
                {showEmotionPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <EmotionPicker
                      selected={emotion}
                      onSelect={(e) => {
                        setEmotion(e);
                        setShowEmotionPicker(false);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Emotion button */}
                <button
                  onClick={() => setShowEmotionPicker(!showEmotionPicker)}
                  className="transition-all duration-200"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    fontWeight: 400,
                    color: emotion
                      ? EMOTION_STYLES_MAP[emotion] || '#a89478'
                      : '#a8947860',
                    backgroundColor: emotion ? '#a8947810' : 'transparent',
                    border: '1px solid #a8947820',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                >
                  {emotion || 'emocao'}
                </button>

                <div className="flex-1" />

                {/* Cancel */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setText('');
                    setEmotion(null);
                    setShowEmotionPicker(false);
                  }}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    color: '#a8947840',
                    padding: '8px 12px',
                  }}
                >
                  Cancelar
                </button>

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={!text.trim() || saving}
                  className="transition-all duration-200"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: text.trim() ? periodColor : '#a8947840',
                    backgroundColor: text.trim() ? periodColor + '15' : 'transparent',
                    border: `1px solid ${text.trim() ? periodColor + '30' : '#a8947820'}`,
                    borderRadius: '8px',
                    padding: '8px 16px',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {saving ? '...' : 'Salvar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default JournalPrompt;

// Quick color lookup for emotion button
const EMOTION_STYLES_MAP: Record<string, string> = {
  calmo: '#8a9e7a',
  focado: '#c4a882',
  grato: '#b8c4a8',
  animado: '#e8a84c',
  confiante: '#a89478',
  ansioso: '#e85d5d',
  cansado: '#6b7280',
  frustrado: '#d4856a',
  triste: '#8a6e5a',
  perdido: '#9ca3af',
  neutro: '#a89478',
};
