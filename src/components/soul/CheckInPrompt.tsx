// components/soul/CheckInPrompt.tsx
// Overlay que aparece ao completar task com check-in
// Três fases: prompt → picking → result

import { motion, AnimatePresence } from 'framer-motion';
import type { CheckInState } from '@/hooks/useSoul';
import type { Emotion } from '@/types/item';
import EmotionPicker from './EmotionPicker';
import PostCheckIn from './PostCheckIn';

interface CheckInPromptProps {
  state: CheckInState;
  onStartPicking: () => void;
  onSelectEmotion: (emotion: Emotion) => void;
  onSkip: () => void;
  onDismiss: () => void;
}

export default function CheckInPrompt({
  state,
  onStartPicking,
  onSelectEmotion,
  onSkip,
  onDismiss,
}: CheckInPromptProps) {
  return (
    <AnimatePresence>
      {state.active && state.trigger && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: '#111318e0' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && state.phase === 'result') onDismiss();
          }}
        >
          <motion.div
            className="w-full max-w-md mx-4 mb-6 overflow-hidden"
            style={{
              backgroundColor: '#1a1d24',
              borderRadius: '16px',
              border: '1px solid #a8947815',
            }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
        {/* ━━━ Phase: Prompt ━━━ */}
        {state.phase === 'prompt' && (
          <div className="flex flex-col gap-4 p-6">
            {/* Chore badge */}
            {state.item?.is_chore && (
              <div
                className="self-start"
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#d4856a',
                  backgroundColor: '#d4856a15',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                ◆ trabalho invisível
              </div>
            )}

            {/* Task title */}
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#a8947860',
                fontWeight: 400,
              }}
            >
              ✓ {state.item?.title}
            </span>

            {/* Prompt */}
            <p
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '22px',
                fontWeight: 300,
                color: '#e8e0d4',
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
              }}
            >
              {state.trigger.prompt}
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={onStartPicking}
                className="flex-1 transition-all duration-200"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#c4a882',
                  backgroundColor: '#c4a88218',
                  border: '1px solid #c4a88230',
                  borderRadius: '10px',
                  padding: '12px 20px',
                }}
              >
                Registrar
              </button>
              <button
                onClick={onSkip}
                className="transition-opacity duration-200 hover:opacity-80"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: '#a8947850',
                  padding: '12px 16px',
                }}
              >
                Pular
              </button>
            </div>
          </div>
        )}

        {/* ━━━ Phase: Picking ━━━ */}
        {state.phase === 'picking' && (
          <div className="flex flex-col gap-4 p-6">
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#a8947850',
                fontWeight: 400,
              }}
            >
              ✓ {state.item?.title}
            </span>

            <EmotionPicker
              selected={null}
              onSelect={onSelectEmotion}
              label="Como você se sente agora?"
            />

            <button
              onClick={onSkip}
              className="self-start mt-1"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#a8947840',
              }}
            >
              ← voltar
            </button>
          </div>
        )}

        {/* ━━━ Phase: Result ━━━ */}
        {state.phase === 'result' && state.emotionAfter && (
          <PostCheckIn
            item={state.item!}
            emotionAfter={state.emotionAfter}
            shift={state.shift}
            onDismiss={onDismiss}
          />
        )}
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
