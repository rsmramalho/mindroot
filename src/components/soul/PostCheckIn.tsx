// components/soul/PostCheckIn.tsx
// Resultado do check-in: mostra shift emocional + confirmação de reflection

import type { AtomItem, Emotion } from '@/types/item';
import type { EmotionalShift } from '@/engine/soul';
import { EMOTION_STYLES } from './EmotionPicker';

interface PostCheckInProps {
  item: AtomItem;
  emotionAfter: Emotion;
  shift: EmotionalShift;
  onDismiss: () => void;
}

const SHIFT_CONFIG: Record<EmotionalShift, { icon: string; message: string; color: string }> = {
  positive: {
    icon: '↑',
    message: 'Movimento positivo',
    color: '#8a9e7a',
  },
  negative: {
    icon: '↓',
    message: 'Algo pesou',
    color: '#d4856a',
  },
  stable: {
    icon: '=',
    message: 'Estável',
    color: '#a89478',
  },
  unknown: {
    icon: '·',
    message: 'Registrado',
    color: '#a89478',
  },
};

export default function PostCheckIn({ item, emotionAfter, shift, onDismiss }: PostCheckInProps) {
  const shiftInfo = SHIFT_CONFIG[shift];
  const afterStyle = EMOTION_STYLES[emotionAfter];
  const emotionBefore = item.body.soul?.emotion_before;
  const isChore = item.tags.includes('chore');

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Shift indicator */}
      <div className="flex items-center gap-3">
        <span
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '32px',
            fontWeight: 300,
            color: shiftInfo.color,
            lineHeight: 1,
          }}
        >
          {shiftInfo.icon}
        </span>
        <div className="flex flex-col">
          <span
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '18px',
              fontWeight: 400,
              color: '#e8e0d4',
            }}
          >
            {shiftInfo.message}
          </span>

          {/* Emotion flow: before → after */}
          <div className="flex items-center gap-2 mt-1">
            {emotionBefore && (
              <>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    color: EMOTION_STYLES[emotionBefore as keyof typeof EMOTION_STYLES]?.color || '#a89478',
                    fontWeight: 500,
                  }}
                >
                  {emotionBefore}
                </span>
                <span style={{ color: '#a8947840', fontSize: '10px' }}>→</span>
              </>
            )}
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: afterStyle.color,
                fontWeight: 600,
              }}
            >
              {emotionAfter}
            </span>
          </div>
        </div>
      </div>

      {/* Chore recognition */}
      {isChore && (
        <div
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '15px',
            fontWeight: 300,
            color: '#d4856a',
            fontStyle: 'italic',
            padding: '8px 0',
            borderTop: '1px solid #a8947810',
          }}
        >
          Trabalho invisível reconhecido ◆
        </div>
      )}

      {/* Reflection created */}
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: '#a8947850',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ fontSize: '10px' }}>○</span>
        Reflexão salva no journal
      </div>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="self-stretch mt-1 transition-all duration-200"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          color: '#a89478',
          backgroundColor: '#a8947812',
          border: '1px solid #a8947820',
          borderRadius: '10px',
          padding: '10px 20px',
        }}
      >
        Fechar
      </button>
    </div>
  );
}
